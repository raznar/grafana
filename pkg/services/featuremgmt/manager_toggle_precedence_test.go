package featuremgmt

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/setting"
)

func TestPredictEnabled_DBOverrideWinsOverExpression(t *testing.T) {
	cfg := setting.NewCfg()
	mgmt, err := ProvideManagerService(cfg)
	require.NoError(t, err)

	// panelTitleSearch defaults to expression "false" in registry
	require.False(t, mgmt.IsEnabledGlobally(FlagPanelTitleSearch))

	mgmt.ReplaceDBOverridesCache(map[string]bool{FlagPanelTitleSearch: true})
	mgmt.update()
	require.True(t, mgmt.IsEnabledGlobally(FlagPanelTitleSearch))
}

func TestPredictEnabled_InheritedWhenNoDBRow(t *testing.T) {
	cfg := setting.NewCfg()
	mgmt, err := ProvideManagerService(cfg)
	require.NoError(t, err)
	mgmt.ReplaceDBOverridesCache(map[string]bool{})
	mgmt.update()
	require.False(t, mgmt.predictEnabled(FlagPanelTitleSearch))
	require.False(t, mgmt.predictEnabledWithoutDBOverride(FlagPanelTitleSearch))
}
