package featuremgmt

import (
	"context"
	"testing"

	"github.com/open-feature/go-sdk/openfeature"
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

	t.Run("set enabled updates runtime state", func(t *testing.T) {
		ft := FeatureManager{
			flags:   map[string]*FeatureFlag{},
			startup: map[string]bool{},
		}
		ft.registerFlags(FeatureFlag{
			Name:       "defaultTrue",
			Expression: "true",
		}, FeatureFlag{
			Name: "defaultFalse",
		})

		require.True(t, ft.IsEnabledGlobally("defaultTrue"))
		require.False(t, ft.IsEnabledGlobally("defaultFalse"))

		require.True(t, ft.SetEnabled("defaultTrue", false))
		require.False(t, ft.IsEnabledGlobally("defaultTrue"))

		require.True(t, ft.SetEnabled("defaultFalse", true))
		require.True(t, ft.IsEnabledGlobally("defaultFalse"))
		require.Equal(t, map[string]bool{"defaultFalse": true}, ft.GetEnabled(context.Background()))
	})

	t.Run("set enabled updates static OpenFeature provider", func(t *testing.T) {
		const flagName = "runtimeOpenFeatureFlag"

		provider, err := newStaticProvider(nil, []FeatureFlag{{
			Name:       flagName,
			Expression: "false",
		}})
		require.NoError(t, err)
		require.NoError(t, openfeature.SetProviderAndWait(provider))
		t.Cleanup(func() {
			require.NoError(t, openfeature.SetProviderAndWait(openfeature.NoopProvider{}))
		})

		ft := FeatureManager{
			flags:   map[string]*FeatureFlag{},
			startup: map[string]bool{},
		}
		ft.registerFlags(FeatureFlag{
			Name: flagName,
		})

		ctx := context.Background()
		evalCtx := openfeature.NewEvaluationContext("grafana", nil)

		details, err := openfeature.NewDefaultClient().BooleanValueDetails(ctx, flagName, false, evalCtx)
		require.NoError(t, err)
		require.False(t, details.Value)

		require.True(t, ft.SetEnabled(flagName, true))

		details, err = openfeature.NewDefaultClient().BooleanValueDetails(ctx, flagName, false, evalCtx)
		require.NoError(t, err)
		require.True(t, details.Value)
	})

	t.Run("set enabled rejects flags that cannot change at runtime", func(t *testing.T) {
		ft := FeatureManager{
			flags:   map[string]*FeatureFlag{},
			startup: map[string]bool{},
		}
		ft.registerFlags(FeatureFlag{
			Name:            "restartRequired",
			RequiresRestart: true,
		}, FeatureFlag{
			Name:            "devOnly",
			RequiresDevMode: true,
		})

		require.False(t, ft.SetEnabled("unknown", true))
		require.False(t, ft.SetEnabled("restartRequired", true))
		require.False(t, ft.SetEnabled("devOnly", true))
		require.False(t, ft.CanSetEnabled("restartRequired"))
		require.False(t, ft.CanSetEnabled("devOnly"))
	})
}
