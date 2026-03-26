package featuremgmt

import (
	"context"
	"fmt"
	"reflect"
	"sort"
	"sync"

	"github.com/grafana/grafana/pkg/infra/log"
)

var (
	_ FeatureToggles = (*FeatureManager)(nil)
)

type FeatureManager struct {
	mu sync.RWMutex

	isDevMod bool

	flags     map[string]*FeatureFlag
	enabled   map[string]bool   // only the "on" values
	startup   map[string]bool   // the explicit values registered at startup
	overrides map[string]bool   // persisted admin overrides
	warnings  map[string]string // potential warnings about the flag
	log       log.Logger
}

type ToggleState struct {
	Flag         FeatureFlag
	Enabled      bool
	Default      bool
	HasOverride  bool
	Override     bool
	Source       string
	Writeable    bool
	Warning      string
}

// This will merge the flags with the current configuration
func (fm *FeatureManager) registerFlags(flags ...FeatureFlag) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	for _, add := range flags {
		if add.Name == "" {
			continue // skip it with warning?
		}
		flag, ok := fm.flags[add.Name]
		if !ok {
			f := add // make a copy
			fm.flags[add.Name] = &f
			continue
		}

		// Selectively update properties
		if add.Description != "" {
			flag.Description = add.Description
		}
		if add.Expression != "" {
			flag.Expression = add.Expression
		}

		// The most recently defined state
		if add.Stage != FeatureStageUnknown {
			flag.Stage = add.Stage
		}

		// Only gets more restrictive
		if add.RequiresDevMode {
			flag.RequiresDevMode = true
		}

		if add.RequiresRestart {
			flag.RequiresRestart = true
		}
	}

	// This will evaluate all flags
	fm.updateLocked()
}

// meetsRequirements checks if grafana is able to run the given feature due to dev mode or licensing requirements
func (fm *FeatureManager) meetsRequirements(ff *FeatureFlag) (bool, string) {
	if ff.RequiresDevMode && !fm.isDevMod {
		return false, "requires dev mode"
	}

	return true, ""
}

// Update
func (fm *FeatureManager) update() {
	fm.mu.Lock()
	defer fm.mu.Unlock()
	fm.updateLocked()
}

func (fm *FeatureManager) updateLocked() {
	enabled := make(map[string]bool)
	for _, flag := range fm.flags {
		// if grafana cannot run the feature, omit metrics around it
		ok, reason := fm.meetsRequirements(flag)
		if !ok {
			fm.warnings[flag.Name] = reason
			featureToggleInfo.WithLabelValues(flag.Name).Set(0)
			continue
		}
		delete(fm.warnings, flag.Name)

		// Update the registry
		track := 0.0

		value := fm.baseEnabledLocked(flag.Name)
		if override, ok := fm.overrides[flag.Name]; ok {
			value = override
		}

		if value {
			track = 1
			enabled[flag.Name] = true
		}

		// Register value with prometheus metric
		featureToggleInfo.WithLabelValues(flag.Name).Set(track)
	}
	fm.enabled = enabled
}

// IsEnabled checks if a feature is enabled
func (fm *FeatureManager) IsEnabled(ctx context.Context, flag string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[flag]
}

// IsEnabledGlobally checks if a feature is for all tenants
func (fm *FeatureManager) IsEnabledGlobally(flag string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[flag]
}

// GetEnabled returns a map containing only the features that are enabled
func (fm *FeatureManager) GetEnabled(ctx context.Context) map[string]bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	enabled := make(map[string]bool, len(fm.enabled))
	for key, val := range fm.enabled {
		if val {
			enabled[key] = true
		}
	}
	return enabled
}

// GetFlags returns all flag definitions
func (fm *FeatureManager) GetFlags() []FeatureFlag {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	v := make([]FeatureFlag, 0, len(fm.flags))
	for _, value := range fm.flags {
		v = append(v, *value)
	}
	return v
}

func (fm *FeatureManager) baseEnabledLocked(flag string) bool {
	startup, ok := fm.startup[flag]
	return startup || (!ok && fm.flags[flag].Expression == "true")
}

func (fm *FeatureManager) LoadOverrides(overrides map[string]bool) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	fm.overrides = make(map[string]bool, len(overrides))
	for key, value := range overrides {
		fm.overrides[key] = value
		if _, ok := fm.flags[key]; !ok {
			fm.flags[key] = &FeatureFlag{
				Name:  key,
				Stage: FeatureStageUnknown,
			}
			fm.warnings[key] = "unknown flag override"
		}
	}

	fm.updateLocked()
}

func (fm *FeatureManager) SetOverride(flag string, enabled bool) error {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	ff, ok := fm.flags[flag]
	if !ok {
		return fmt.Errorf("unknown feature flag %q", flag)
	}

	if ok, reason := fm.meetsRequirements(ff); !ok {
		return fmt.Errorf("%s", reason)
	}

	if enabled == fm.baseEnabledLocked(flag) {
		delete(fm.overrides, flag)
	} else {
		fm.overrides[flag] = enabled
	}

	fm.updateLocked()
	return nil
}

func (fm *FeatureManager) GetOverrides() map[string]bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	overrides := make(map[string]bool, len(fm.overrides))
	for key, value := range fm.overrides {
		overrides[key] = value
	}

	return overrides
}

func (fm *FeatureManager) GetToggleStates() []ToggleState {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	states := make([]ToggleState, 0, len(fm.flags))
	for _, flag := range fm.flags {
		defaultEnabled := fm.baseEnabledLocked(flag.Name)
		enabled := defaultEnabled
		source := "default"
		override, hasOverride := fm.overrides[flag.Name]
		if _, hasStartup := fm.startup[flag.Name]; hasStartup {
			source = "startup"
		}
		if hasOverride {
			enabled = override
			source = "labs"
		}

		warning := fm.warnings[flag.Name]
		writeable := warning == ""
		states = append(states, ToggleState{
			Flag:        *flag,
			Enabled:     enabled,
			Default:     defaultEnabled,
			HasOverride: hasOverride,
			Override:    override,
			Source:      source,
			Writeable:   writeable,
			Warning:     warning,
		})
	}

	sort.Slice(states, func(i, j int) bool {
		return states[i].Flag.Name < states[j].Flag.Name
	})

	return states
}

// ############# Test Functions #############

func WithFeatures(spec ...any) FeatureToggles {
	return WithManager(spec...)
}

// WithFeatures is used to define feature toggles for testing.
// The arguments are a list of strings that are optionally followed by a boolean value for example:
// WithFeatures([]any{"my_feature", "other_feature"}) or WithFeatures([]any{"my_feature", true})
func WithManager(spec ...any) *FeatureManager {
	count := len(spec)
	features := make(map[string]*FeatureFlag, count)
	enabled := make(map[string]bool, count)

	idx := 0
	for idx < count {
		key := fmt.Sprintf("%v", spec[idx])
		val := true
		idx++
		if idx < count && reflect.TypeOf(spec[idx]).Kind() == reflect.Bool {
			val = spec[idx].(bool)
			idx++
		}

		features[key] = &FeatureFlag{Name: key}
		if val {
			enabled[key] = true
		}
	}

	return &FeatureManager{enabled: enabled, flags: features, startup: enabled, overrides: map[string]bool{}, warnings: map[string]string{}}
}
