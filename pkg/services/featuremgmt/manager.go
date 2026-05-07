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
	isDevMod bool
	mu       sync.RWMutex

	flags    map[string]*FeatureFlag
	enabled  map[string]bool   // only the "on" values
	startup  map[string]bool   // the explicit values registered at startup
	warnings map[string]string // potential warnings about the flag
	log      log.Logger
}

// This will merge the flags with the current configuration
func (fm *FeatureManager) registerFlags(flags ...FeatureFlag) {
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
	fm.update()
}

// meetsRequirements checks if grafana is able to run the given feature due to dev mode or licensing requirements
func (fm *FeatureManager) meetsRequirements(ff *FeatureFlag) (bool, string) {
	if ff.RequiresDevMode && !fm.isDevMod {
		return false, "requires dev mode"
	}

	return true, ""
}

// CanToggleAtRuntime reports whether the flag's enabled state can be changed at runtime
// without a restart. This matches the validation applied by SetEnabled and SetEnabledBatch.
func (fm *FeatureManager) CanToggleAtRuntime(ff *FeatureFlag) bool {
	if ff.RequiresRestart {
		return false
	}
	ok, _ := fm.meetsRequirements(ff)
	return ok
}

// Update
func (fm *FeatureManager) update() {
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

// SetEnabled toggles a feature flag at runtime. Returns false if the flag
// doesn't exist, requires a restart, or doesn't meet runtime requirements.
func (fm *FeatureManager) SetEnabled(name string, enabled bool) bool {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	flag, ok := fm.flags[name]
	if !ok {
		return false
	}
	if !fm.CanToggleAtRuntime(flag) {
		return false
	}

	fm.startup[name] = enabled
	fm.update()
	return true
}

// RuntimeToggleUpdate is one entry in a batch of runtime toggle changes.
type RuntimeToggleUpdate struct {
	Name    string
	Enabled bool
}

// SetEnabledBatch validates every update, then applies them together under one lock.
// If any update is invalid, it returns false and the name of the first failing toggle;
// in that case the feature manager state is unchanged.
func (fm *FeatureManager) SetEnabledBatch(updates []RuntimeToggleUpdate) (ok bool, failedName string) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	for _, u := range updates {
		flag, exists := fm.flags[u.Name]
		if !exists {
			return false, u.Name
		}
		if !fm.CanToggleAtRuntime(flag) {
			return false, u.Name
		}
	}

	for _, u := range updates {
		fm.startup[u.Name] = u.Enabled
	}
	fm.update()
	return true, ""
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
