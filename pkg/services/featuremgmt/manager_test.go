package featuremgmt

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFeatureManager(t *testing.T) {
	t.Run("check testing stubs", func(t *testing.T) {
		ft := WithManager("a", "b", "c")
		require.True(t, ft.IsEnabledGlobally("a"))
		require.True(t, ft.IsEnabledGlobally("b"))
		require.True(t, ft.IsEnabledGlobally("c"))
		require.False(t, ft.IsEnabledGlobally("d"))

		require.Equal(t, map[string]bool{"a": true, "b": true, "c": true}, ft.GetEnabled(context.Background()))

		// Explicit values
		ft = WithManager("a", true, "b", false)
		require.True(t, ft.IsEnabledGlobally("a"))
		require.False(t, ft.IsEnabledGlobally("b"))
		require.Equal(t, map[string]bool{"a": true}, ft.GetEnabled(context.Background()))
	})

	t.Run("check description and stage configs", func(t *testing.T) {
		ft := FeatureManager{
			flags: map[string]*FeatureFlag{},
		}
		ft.registerFlags(FeatureFlag{
			Name:        "a",
			Description: "first",
		}, FeatureFlag{
			Name:        "a",
			Description: "second",
		}, FeatureFlag{
			Name:  "a",
			Stage: FeatureStagePrivatePreview,
		}, FeatureFlag{
			Name: "a",
		})
		flag := ft.flags["a"]
		require.Equal(t, "second", flag.Description)
		require.Equal(t, FeatureStagePrivatePreview, flag.Stage)
	})

	t.Run("check startup false flags", func(t *testing.T) {
		ft := FeatureManager{
			flags:     map[string]*FeatureFlag{},
			overrides: map[string]bool{},
			warnings:  map[string]string{},
			startup: map[string]bool{
				"a": true,
				"b": false, // but default true
			},
		}
		ft.registerFlags(FeatureFlag{
			Name: "a",
		}, FeatureFlag{
			Name:       "b",
			Expression: "true",
		}, FeatureFlag{
			Name: "c",
		})
		require.True(t, ft.IsEnabledGlobally("a"))
		require.False(t, ft.IsEnabledGlobally("b"))
		require.False(t, ft.IsEnabledGlobally("c"))
	})

	t.Run("set override resets when value matches default", func(t *testing.T) {
		ft := FeatureManager{
			flags: map[string]*FeatureFlag{
				"a": {Name: "a", Expression: "false"},
				"b": {Name: "b", Expression: "true"},
			},
			enabled:   map[string]bool{},
			startup:   map[string]bool{},
			overrides: map[string]bool{},
			warnings:  map[string]string{},
		}
		ft.update()

		require.NoError(t, ft.SetOverride("a", true))
		require.True(t, ft.IsEnabledGlobally("a"))
		require.Equal(t, map[string]bool{"a": true}, ft.GetOverrides())

		require.NoError(t, ft.SetOverride("a", false))
		require.False(t, ft.IsEnabledGlobally("a"))
		require.Empty(t, ft.GetOverrides())

		require.NoError(t, ft.SetOverride("b", false))
		require.False(t, ft.IsEnabledGlobally("b"))
		require.Equal(t, map[string]bool{"b": false}, ft.GetOverrides())
	})

	t.Run("toggle states expose source and writeability", func(t *testing.T) {
		ft := FeatureManager{
			isDevMod: false,
			flags: map[string]*FeatureFlag{
				"a": {Name: "a", Expression: "false"},
				"b": {Name: "b", Expression: "false", RequiresDevMode: true},
				"c": {Name: "c", Expression: "false"},
			},
			enabled:   map[string]bool{},
			startup:   map[string]bool{"c": true},
			overrides: map[string]bool{"a": true},
			warnings:  map[string]string{},
		}
		ft.update()

		states := ft.GetToggleStates()
		require.Len(t, states, 3)

		require.Equal(t, "a", states[0].Flag.Name)
		require.True(t, states[0].Enabled)
		require.Equal(t, "labs", states[0].Source)
		require.True(t, states[0].Writeable)

		require.Equal(t, "b", states[1].Flag.Name)
		require.False(t, states[1].Writeable)
		require.Equal(t, "requires dev mode", states[1].Warning)

		require.Equal(t, "c", states[2].Flag.Name)
		require.True(t, states[2].Enabled)
		require.Equal(t, "startup", states[2].Source)
	})
}
