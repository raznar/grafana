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
			flags: map[string]*FeatureFlag{},
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

	t.Run("SetEnabled toggles a flag at runtime", func(t *testing.T) {
		ft := &FeatureManager{
			flags:    map[string]*FeatureFlag{},
			startup:  map[string]bool{},
			enabled:  map[string]bool{},
			warnings: map[string]string{},
		}
		ft.registerFlags(FeatureFlag{Name: "myFlag"})
		require.False(t, ft.IsEnabledGlobally("myFlag"))

		ok := ft.SetEnabled("myFlag", true)
		require.True(t, ok)
		require.True(t, ft.IsEnabledGlobally("myFlag"))

		ok = ft.SetEnabled("myFlag", false)
		require.True(t, ok)
		require.False(t, ft.IsEnabledGlobally("myFlag"))
	})

	t.Run("SetEnabled rejects non-existent flag", func(t *testing.T) {
		ft := &FeatureManager{
			flags:    map[string]*FeatureFlag{},
			startup:  map[string]bool{},
			enabled:  map[string]bool{},
			warnings: map[string]string{},
		}
		ok := ft.SetEnabled("doesNotExist", true)
		require.False(t, ok)
	})

	t.Run("SetEnabled rejects RequiresRestart flag", func(t *testing.T) {
		ft := &FeatureManager{
			flags:    map[string]*FeatureFlag{},
			startup:  map[string]bool{},
			enabled:  map[string]bool{},
			warnings: map[string]string{},
		}
		ft.registerFlags(FeatureFlag{Name: "restartFlag", RequiresRestart: true})
		ok := ft.SetEnabled("restartFlag", true)
		require.False(t, ok)
	})

	t.Run("SetEnabled rejects RequiresDevMode flag in prod", func(t *testing.T) {
		ft := &FeatureManager{
			isDevMod: false,
			flags:    map[string]*FeatureFlag{},
			startup:  map[string]bool{},
			enabled:  map[string]bool{},
			warnings: map[string]string{},
		}
		ft.registerFlags(FeatureFlag{Name: "devFlag", RequiresDevMode: true})
		ok := ft.SetEnabled("devFlag", true)
		require.False(t, ok)
	})

	t.Run("SetEnabled allows RequiresDevMode flag in dev", func(t *testing.T) {
		ft := &FeatureManager{
			isDevMod: true,
			flags:    map[string]*FeatureFlag{},
			startup:  map[string]bool{},
			enabled:  map[string]bool{},
			warnings: map[string]string{},
		}
		ft.registerFlags(FeatureFlag{Name: "devFlag", RequiresDevMode: true})
		ok := ft.SetEnabled("devFlag", true)
		require.True(t, ok)
		require.True(t, ft.IsEnabledGlobally("devFlag"))
	})

	t.Run("SetEnabledBatch is all-or-nothing when one toggle is invalid", func(t *testing.T) {
		ft := &FeatureManager{
			flags:    map[string]*FeatureFlag{},
			startup:  map[string]bool{},
			enabled:  map[string]bool{},
			warnings: map[string]string{},
		}
		ft.registerFlags(FeatureFlag{Name: "a"}, FeatureFlag{Name: "b"})
		require.False(t, ft.IsEnabledGlobally("a"))
		require.False(t, ft.IsEnabledGlobally("b"))

		ok, failed := ft.SetEnabledBatch([]RuntimeToggleUpdate{
			{Name: "a", Enabled: true},
			{Name: "missing", Enabled: true},
		})
		require.False(t, ok)
		require.Equal(t, "missing", failed)
		require.False(t, ft.IsEnabledGlobally("a"))
		require.False(t, ft.IsEnabledGlobally("b"))

		ok, failed = ft.SetEnabledBatch([]RuntimeToggleUpdate{
			{Name: "a", Enabled: true},
			{Name: "b", Enabled: true},
		})
		require.True(t, ok)
		require.Empty(t, failed)
		require.True(t, ft.IsEnabledGlobally("a"))
		require.True(t, ft.IsEnabledGlobally("b"))
	})
}
