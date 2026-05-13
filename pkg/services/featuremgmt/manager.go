package featuremgmt

import (
	"context"
	"fmt"
	"reflect"
	"sort"

	"github.com/grafana/grafana/pkg/infra/log"
)

var (
	_ FeatureToggles = (*FeatureManager)(nil)
)

type FeatureManager struct {
	isDevMod bool

	flags       map[string]*FeatureFlag
	enabled     map[string]bool   // only the "on" values
	startup     map[string]bool   // the explicit values registered at startup
	dbOverrides map[string]bool   // persisted operator overrides (loaded after DB init)
	warnings    map[string]string // potential warnings about the flag
	log         log.Logger
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

// Update recomputes enabled flags using precedence: database overrides > startup (ini) > registry expression default.
func (fm *FeatureManager) update() {
	enabled := make(map[string]bool)
	for _, flag := range fm.flags {
		// if grafana cannot run the feature, omit metrics around it
		ok, reason := fm.meetsRequirements(flag)
		if !ok {
			fm.warnings[flag.Name] = reason
			continue
		}

		track := 0.0
		if fm.predictEnabled(flag.Name) {
			track = 1
			enabled[flag.Name] = true
		}

		featureToggleInfo.WithLabelValues(flag.Name).Set(track)
	}
	fm.enabled = enabled
}

func (fm *FeatureManager) predictEnabled(name string) bool {
	flag := fm.flags[name]
	if flag == nil {
		return false
	}
	if fm.dbOverrides != nil {
		if v, ok := fm.dbOverrides[name]; ok {
			return v
		}
	}
	return fm.predictEnabledWithoutDBOverride(name)
}

func (fm *FeatureManager) predictEnabledWithoutDBOverride(name string) bool {
	flag := fm.flags[name]
	if flag == nil {
		return false
	}
	if v, ok := fm.startup[name]; ok {
		return v
	}
	return flag.Expression == "true"
}

// IsEnabled checks if a feature is enabled
func (fm *FeatureManager) IsEnabled(ctx context.Context, flag string) bool {
	return fm.enabled[flag]
}

// IsEnabledGlobally checks if a feature is for all tenants
func (fm *FeatureManager) IsEnabledGlobally(flag string) bool {
	return fm.enabled[flag]
}

// GetEnabled returns a map containing only the features that are enabled
func (fm *FeatureManager) GetEnabled(ctx context.Context) map[string]bool {
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
	v := make([]FeatureFlag, 0, len(fm.flags))
	for _, value := range fm.flags {
		v = append(v, *value)
	}
	return v
}

// ReloadDatabaseOverrides loads overrides from the database and reapplies toggle evaluation (server startup).
func (fm *FeatureManager) ReloadDatabaseOverrides(ctx context.Context, reader FeatureToggleOverridesReader) error {
	if reader == nil {
		return nil
	}
	m, err := reader.List(ctx)
	if err != nil {
		return err
	}
	fm.ReplaceDBOverridesCache(m)
	fm.update()
	return nil
}

// ReplaceDBOverridesCache replaces the in-memory override map without re-evaluating runtime toggles (after API writes).
func (fm *FeatureManager) ReplaceDBOverridesCache(m map[string]bool) {
	if m == nil {
		fm.dbOverrides = make(map[string]bool)
		return
	}
	fm.dbOverrides = m
}

// RestartRequiredForOverrides is true when a future restart would change any toggle relative to the running process.
func (fm *FeatureManager) RestartRequiredForOverrides() bool {
	for _, flag := range fm.flags {
		if ok, _ := fm.meetsRequirements(flag); !ok {
			continue
		}
		if fm.predictEnabled(flag.Name) != fm.enabled[flag.Name] {
			return true
		}
	}
	return false
}

// GetAllFlagsWithStatus returns sorted flag metadata and state for theLabs admin API.
func (fm *FeatureManager) GetAllFlagsWithStatus() []FlagStatus {
	names := make([]string, 0, len(fm.flags))
	for name := range fm.flags {
		names = append(names, name)
	}
	sort.Strings(names)

	out := make([]FlagStatus, 0, len(names))
	for _, name := range names {
		flag := fm.flags[name]
		if flag == nil {
			continue
		}
		st := FlagStatus{
			Name:                  name,
			Description:           flag.Description,
			Stage:                 flag.Stage,
			Owner:                 string(flag.Owner),
			Expression:            flag.Expression,
			RequiresRestart:       flag.RequiresRestart,
			RequiresDevMode:       flag.RequiresDevMode,
			RuntimeEnabled:        fm.enabled[name],
			AfterRestart:          fm.predictEnabled(name),
			InheritedAfterRestart: fm.predictEnabledWithoutDBOverride(name),
			ReadOnly:              fm.hasIniEntry(name),
		}
		if fm.dbOverrides != nil {
			if v, ok := fm.dbOverrides[name]; ok {
				st.HasOverride = true
				vv := v
				st.Override = &vv
			}
		}
		if ok, reason := fm.meetsRequirements(flag); !ok {
			st.Unavailable = true
			st.UnavailableReason = reason
			st.RuntimeEnabled = false
			st.AfterRestart = false
			st.InheritedAfterRestart = false
		}
		out = append(out, st)
	}
	return out
}

func (fm *FeatureManager) hasIniEntry(name string) bool {
	_, ok := fm.startup[name]
	return ok
}

// HasIniEntry reports whether the toggle is explicitly set in config (cannot be overridden from Labs).
func (fm *FeatureManager) HasIniEntry(name string) bool {
	return fm.hasIniEntry(name)
}

// HasFlag reports whether the name exists in the feature registry (including unknown flags parsed from config).
func (fm *FeatureManager) HasFlag(name string) bool {
	_, ok := fm.flags[name]
	return ok
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

	return &FeatureManager{enabled: enabled, flags: features, startup: enabled, dbOverrides: map[string]bool{}, warnings: map[string]string{}}
}
