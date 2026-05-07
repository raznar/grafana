package api

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func newTestFeatureManager() *featuremgmt.FeatureManager {
	return featuremgmt.WithManager("featureA", true, "featureB", false)
}

func featureToggleAdminUser() *user.SignedInUser {
	u := userWithPermissions(1, nil)
	u.IsGrafanaAdmin = true
	return u
}

func TestAPI_AdminGetFeatureToggles(t *testing.T) {
	t.Run("returns feature toggles for admin", func(t *testing.T) {
		fm := newTestFeatureManager()
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.FeatureManager = fm
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/admin/feature-toggles"),
			featureToggleAdminUser(),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())
		assert.Contains(t, string(body), `"featureA"`)
		assert.Contains(t, string(body), `"featureB"`)
	})

	t.Run("returns 403 for user without permission", func(t *testing.T) {
		fm := newTestFeatureManager()
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.FeatureManager = fm
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/admin/feature-toggles"),
			userWithPermissions(1, nil),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})
}

func TestAPI_AdminUpdateFeatureToggles(t *testing.T) {
	t.Run("updates a toggle successfully", func(t *testing.T) {
		fm := newTestFeatureManager()
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.FeatureManager = fm
		})

		reqBody := `{"toggles":[{"name":"featureB","enabled":true}]}`
		req := server.NewRequest(http.MethodPut, "/api/admin/feature-toggles", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		res, err := server.Send(webtest.RequestWithSignedInUser(
			req,
			featureToggleAdminUser(),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 400 for non-existent toggle", func(t *testing.T) {
		fm := newTestFeatureManager()
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.FeatureManager = fm
		})

		reqBody := `{"toggles":[{"name":"doesNotExist","enabled":true}]}`
		req := server.NewRequest(http.MethodPut, "/api/admin/feature-toggles", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		res, err := server.Send(webtest.RequestWithSignedInUser(
			req,
			featureToggleAdminUser(),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 403 for user without permission", func(t *testing.T) {
		fm := newTestFeatureManager()
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.FeatureManager = fm
		})

		reqBody := `{"toggles":[{"name":"featureA","enabled":false}]}`
		req := server.NewRequest(http.MethodPut, "/api/admin/feature-toggles", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		res, err := server.Send(webtest.RequestWithSignedInUser(
			req,
			userWithPermissions(1, nil),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})
}
