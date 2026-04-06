package featuremgmt

import (
	"context"
	"fmt"
	"reflect"
	"sync"

	"github.com/grafana/grafana/pkg/infra/log"
)

var (
	_ FeatureToggles = (*FeatureManager)(nil)
)

type FeatureManager struct {
	mu sync.RWMutex

	isDevMod bool

	flags    map[string]*FeatureFlag
	enabled  map[string]bool   // only the "on" values
	startup  map[string]bool   // the explicit values registered at startup
	warnings map[string]string // potential warnings about the flag
	log      log.Logger
}

// RuntimeToggleUpdate is a single feature toggle change for batch updates.
type RuntimeToggleUpdate struct {
	Name    string
	Enabled bool
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
	fm.recomputeEnabled()
}

// meetsRequirements checks if grafana is able to run the given feature due to dev mode or licensing requirements
func (fm *FeatureManager) meetsRequirements(ff *FeatureFlag) (bool, string) {
	if ff.RequiresDevMode && !fm.isDevMod {
		return false, "requires dev mode"
	}

	return true, ""
}

// recomputeEnabled rebuilds fm.enabled from flags and startup. Caller must hold fm.mu.
func (fm *FeatureManager) recomputeEnabled() {
	enabled := make(map[string]bool)
	for _, flag := range fm.flags {
		// if grafana cannot run the feature, omit metrics around it
		ok, reason := fm.meetsRequirements(flag)
		if !ok {
			fm.warnings[flag.Name] = reason
			continue
		}

		// Update the registry
		track := 0.0

		startup, ok := fm.startup[flag.Name]
		if startup || (!ok && flag.Expression == "true") {
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

// CanRuntimeToggle reports whether SetEnabled would accept a change for this flag name.
func (fm *FeatureManager) CanRuntimeToggle(name string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	flag, ok := fm.flags[name]
	if !ok {
		return false
	}
	if flag.RequiresRestart {
		return false
	}
	ok, _ = fm.meetsRequirements(flag)
	return ok
}

// validateRuntimeToggle returns whether the flag exists and may be toggled at runtime (caller must hold fm.mu).
func (fm *FeatureManager) validateRuntimeToggle(name string) bool {
	flag, ok := fm.flags[name]
	if !ok {
		return false
	}
	if flag.RequiresRestart {
		return false
	}
	ok, _ = fm.meetsRequirements(flag)
	return ok
}

// ApplyRuntimeToggleUpdates applies multiple toggle updates atomically: either all succeed or none are applied.
// On failure it returns the name of the first invalid toggle and false.
func (fm *FeatureManager) ApplyRuntimeToggleUpdates(updates []RuntimeToggleUpdate) (failedName string, ok bool) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	for _, u := range updates {
		if !fm.validateRuntimeToggle(u.Name) {
			return u.Name, false
		}
	}
	for _, u := range updates {
		fm.startup[u.Name] = u.Enabled
	}
	fm.recomputeEnabled()
	return "", true
}

// SetEnabled sets the enabled state of a feature flag at runtime.
// Returns false if the flag doesn't exist or can't be toggled.
func (fm *FeatureManager) SetEnabled(name string, enabled bool) bool {
	fm.mu.Lock()
	defer fm.mu.Unlock()
	if !fm.validateRuntimeToggle(name) {
		return false
	}
	fm.startup[name] = enabled
	fm.recomputeEnabled()
	return true
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

	return &FeatureManager{enabled: enabled, flags: features, startup: enabled, warnings: map[string]string{}}
}
