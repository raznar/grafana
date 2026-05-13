package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_AdminFeatureToggles(t *testing.T) {
	t.Run("lists feature toggles sorted by name", func(t *testing.T) {
		server, _ := setupAdminFeatureTogglesTestServer(t)

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles"), grafanaAdminUser()))
		require.NoError(t, err)
		defer func() {
			require.NoError(t, res.Body.Close())
		}()

		require.Equal(t, http.StatusOK, res.StatusCode)

		var toggles []adminFeatureToggleDTO
		require.NoError(t, json.NewDecoder(res.Body).Decode(&toggles))
		require.NotEmpty(t, toggles)

		for i := 1; i < len(toggles); i++ {
			assert.True(t, toggles[i-1].Name <= toggles[i].Name)
		}

		publicDashboardsScene := findAdminFeatureToggle(t, toggles, "publicDashboardsScene")
		assert.Equal(t, "GA", publicDashboardsScene.Stage)
		assert.True(t, publicDashboardsScene.Enabled)
		assert.True(t, publicDashboardsScene.FrontendOnly)
		assert.False(t, publicDashboardsScene.ReadOnly)

		liveAPIServer := findAdminFeatureToggle(t, toggles, "liveAPIServer")
		assert.True(t, liveAPIServer.ReadOnly)
		assert.True(t, liveAPIServer.RequiresRestart)
	})

	t.Run("updates a runtime editable feature toggle", func(t *testing.T) {
		server, manager := setupAdminFeatureTogglesTestServer(t)

		res, err := server.SendJSON(webtest.RequestWithSignedInUser(
			server.NewRequest(http.MethodPut, "/api/admin/feature-toggles", bytes.NewBufferString(`{"toggles":[{"name":"featureHighlights","enabled":true}]}`)),
			grafanaAdminUser(),
		))
		require.NoError(t, err)
		defer func() {
			require.NoError(t, res.Body.Close())
		}()

		require.Equal(t, http.StatusOK, res.StatusCode)
		assert.True(t, manager.IsEnabled(context.Background(), "featureHighlights"))
	})

	t.Run("rejects unknown feature toggles", func(t *testing.T) {
		server, manager := setupAdminFeatureTogglesTestServer(t)

		res, err := server.SendJSON(webtest.RequestWithSignedInUser(
			server.NewRequest(http.MethodPut, "/api/admin/feature-toggles", bytes.NewBufferString(`{"toggles":[{"name":"doesNotExist","enabled":true}]}`)),
			grafanaAdminUser(),
		))
		require.NoError(t, err)
		defer func() {
			require.NoError(t, res.Body.Close())
		}()

		require.Equal(t, http.StatusBadRequest, res.StatusCode)
		assert.False(t, manager.IsEnabled(context.Background(), "doesNotExist"))
	})

	t.Run("rejects feature toggles that require restart", func(t *testing.T) {
		server, manager := setupAdminFeatureTogglesTestServer(t)

		res, err := server.SendJSON(webtest.RequestWithSignedInUser(
			server.NewRequest(http.MethodPut, "/api/admin/feature-toggles", bytes.NewBufferString(`{"toggles":[{"name":"liveAPIServer","enabled":true}]}`)),
			grafanaAdminUser(),
		))
		require.NoError(t, err)
		defer func() {
			require.NoError(t, res.Body.Close())
		}()

		require.Equal(t, http.StatusBadRequest, res.StatusCode)
		assert.False(t, manager.IsEnabled(context.Background(), "liveAPIServer"))
	})

	t.Run("requires Grafana server admin", func(t *testing.T) {
		server, _ := setupAdminFeatureTogglesTestServer(t)

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles"), userWithPermissions(1, nil)))
		require.NoError(t, err)
		defer func() {
			require.NoError(t, res.Body.Close())
		}()

		require.Equal(t, http.StatusForbidden, res.StatusCode)
	})
}

func setupAdminFeatureTogglesTestServer(t *testing.T) (*webtest.Server, *featuremgmt.FeatureManager) {
	t.Helper()

	cfg := setting.NewCfg()
	manager, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Cfg = cfg
		hs.Features = manager
	})

	return server, manager
}

func grafanaAdminUser() *user.SignedInUser {
	u := userWithPermissions(1, nil)
	u.IsGrafanaAdmin = true
	return u
}

func findAdminFeatureToggle(t *testing.T, toggles []adminFeatureToggleDTO, name string) adminFeatureToggleDTO {
	t.Helper()

	for _, toggle := range toggles {
		if toggle.Name == name {
			return toggle
		}
	}

	require.Failf(t, "feature toggle not found", "expected to find %q", name)
	return adminFeatureToggleDTO{}
}
