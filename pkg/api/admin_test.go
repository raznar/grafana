package api

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/infra/db/dbtest"
	"github.com/grafana/grafana/pkg/infra/kvstore"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/anonymous/anontest"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/services/stats"
	"github.com/grafana/grafana/pkg/services/stats/statstest"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_AdminGetSettings(t *testing.T) {
	type testCase struct {
		desc         string
		expectedCode int
		expectedBody string
		permissions  []accesscontrol.Permission
	}
	tests := []testCase{
		{
			desc:         "should return all settings",
			expectedCode: http.StatusOK,
			expectedBody: `{"auth.proxy":{"enable_login_token":"false","enabled":"false"},"auth.saml":{"allow_idp_initiated":"false","enabled":"true"}}`,
			permissions: []accesscontrol.Permission{
				{
					Action: accesscontrol.ActionSettingsRead,
					Scope:  accesscontrol.ScopeSettingsAll,
				},
			},
		},
		{
			desc:         "should only return auth.saml settings",
			expectedCode: http.StatusOK,
			expectedBody: `{"auth.saml":{"allow_idp_initiated":"false","enabled":"true"}}`,
			permissions: []accesscontrol.Permission{
				{
					Action: accesscontrol.ActionSettingsRead,
					Scope:  "settings:auth.saml:*",
				},
			},
		},
		{
			desc:         "should only partial properties from auth.saml and auth.proxy settings",
			expectedCode: http.StatusOK,
			expectedBody: `{"auth.proxy":{"enable_login_token":"false"},"auth.saml":{"enabled":"true"}}`,
			permissions: []accesscontrol.Permission{
				{
					Action: accesscontrol.ActionSettingsRead,
					Scope:  "settings:auth.saml:enabled",
				},
				{
					Action: accesscontrol.ActionSettingsRead,
					Scope:  "settings:auth.proxy:enable_login_token",
				},
			},
		},
	}

	cfg := setting.NewCfg()
	//seed sections and keys
	cfg.Raw.DeleteSection("DEFAULT")
	saml, err := cfg.Raw.NewSection("auth.saml")
	assert.NoError(t, err)
	_, err = saml.NewKey("enabled", "true")
	assert.NoError(t, err)
	_, err = saml.NewKey("allow_idp_initiated", "false")
	assert.NoError(t, err)

	proxy, err := cfg.Raw.NewSection("auth.proxy")
	assert.NoError(t, err)
	_, err = proxy.NewKey("enabled", "false")
	assert.NoError(t, err)
	_, err = proxy.NewKey("enable_login_token", "false")
	assert.NoError(t, err)

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			server := SetupAPITestServer(t, func(hs *HTTPServer) {
				hs.Cfg = cfg
				hs.SettingsProvider = setting.ProvideProvider(hs.Cfg)
			})

			res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/settings"), userWithPermissions(1, tt.permissions)))
			require.NoError(t, err)
			assert.Equal(t, tt.expectedCode, res.StatusCode)
			body, err := io.ReadAll(res.Body)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedBody, string(body))
			require.NoError(t, res.Body.Close())
		})
	}
}

func TestAdmin_AccessControl(t *testing.T) {
	type testCase struct {
		desc         string
		url          string
		permissions  []accesscontrol.Permission
		expectedCode int
	}

	tests := []testCase{
		{
			expectedCode: http.StatusOK,
			desc:         "AdminGetStats should return 200 for user with correct permissions",
			url:          "/api/admin/stats",
			permissions: []accesscontrol.Permission{
				{
					Action: accesscontrol.ActionServerStatsRead,
				},
			},
		},
		{
			expectedCode: http.StatusForbidden,
			desc:         "AdminGetStats should return 403 for user without required permissions",
			url:          "/api/admin/stats",
			permissions: []accesscontrol.Permission{
				{
					Action: "wrong",
				},
			},
		},
		{
			expectedCode: http.StatusOK,
			desc:         "AdminGetSettings should return 200 for user with correct permissions",
			url:          "/api/admin/settings",
			permissions: []accesscontrol.Permission{
				{
					Action: accesscontrol.ActionSettingsRead,
				},
			},
		},
		{
			expectedCode: http.StatusForbidden,
			desc:         "AdminGetSettings should return 403 for user without required permissions",
			url:          "/api/admin/settings",
			permissions: []accesscontrol.Permission{
				{
					Action: "wrong",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			fakeStatsService := statstest.NewFakeService()
			fakeStatsService.ExpectedAdminStats = &stats.AdminStats{}
			fakeAnonService := anontest.NewFakeService()
			fakeAnonService.ExpectedCountDevices = 0
			server := SetupAPITestServer(t, func(hs *HTTPServer) {
				hs.Cfg = setting.NewCfg()
				hs.SQLStore = dbtest.NewFakeDB()
				hs.SettingsProvider = &setting.OSSImpl{Cfg: hs.Cfg}
				hs.statsService = fakeStatsService
				hs.anonService = fakeAnonService
			})

			res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest(tt.url), userWithPermissions(1, tt.permissions)))
			require.NoError(t, err)
			assert.Equal(t, tt.expectedCode, res.StatusCode)
			require.NoError(t, res.Body.Close())
		})
	}
}

func TestAdminLabsFeatureToggles(t *testing.T) {
	t.Run("returns labs feature flags for grafana admin", func(t *testing.T) {
		cfg := setting.NewCfg()
		manager, err := featuremgmt.ProvideManagerService(cfg)
		require.NoError(t, err)

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.SQLStore = dbtest.NewFakeDB()
			hs.SettingsProvider = &setting.OSSImpl{Cfg: hs.Cfg}
			hs.featureManager = manager
			hs.Features = manager
			hs.kvStore = kvstore.NewFakeKVStore()
		})

		admin := &user.SignedInUser{
			OrgID:          1,
			OrgRole:        identity.RoleAdmin,
			IsGrafanaAdmin: true,
		}

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/labs"), admin))
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var payload featuretoggleapi.ResolvedToggleState
		require.NoError(t, json.Unmarshal(body, &payload))
		require.True(t, payload.AllowEditing)
		require.NotEmpty(t, payload.Toggles)

		var found bool
		for _, toggle := range payload.Toggles {
			if toggle.Name == featuremgmt.FlagProvisioning {
				found = true
				break
			}
		}
		require.True(t, found, "expected provisioning flag to be present")
	})

	t.Run("rejects non grafana admin", func(t *testing.T) {
		cfg := setting.NewCfg()
		manager, err := featuremgmt.ProvideManagerService(cfg)
		require.NoError(t, err)

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.SQLStore = dbtest.NewFakeDB()
			hs.SettingsProvider = &setting.OSSImpl{Cfg: hs.Cfg}
			hs.featureManager = manager
			hs.Features = manager
			hs.kvStore = kvstore.NewFakeKVStore()
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/labs"), &user.SignedInUser{
			OrgID:   1,
			OrgRole: identity.RoleAdmin,
		}))
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("updates and persists override", func(t *testing.T) {
		cfg := setting.NewCfg()
		manager, err := featuremgmt.ProvideManagerService(cfg)
		require.NoError(t, err)
		kv := kvstore.NewFakeKVStore()

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.SQLStore = dbtest.NewFakeDB()
			hs.SettingsProvider = &setting.OSSImpl{Cfg: hs.Cfg}
			hs.featureManager = manager
			hs.Features = manager
			hs.kvStore = kv
		})

		admin := &user.SignedInUser{
			OrgID:          1,
			OrgRole:        identity.RoleAdmin,
			IsGrafanaAdmin: true,
		}

		req := server.NewRequest(http.MethodPut, "/api/admin/labs/panelTitleSearch", strings.NewReader(`{"enabled":true}`))
		res, err := server.SendJSON(webtest.RequestWithSignedInUser(req, admin))
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, res.StatusCode)
		require.NoError(t, res.Body.Close())
		require.True(t, manager.IsEnabledGlobally("panelTitleSearch"))

		raw, ok, err := (&HTTPServer{kvStore: kv}).labsOverrideStore().Get(t.Context(), "overrides")
		require.NoError(t, err)
		require.True(t, ok)

		overrides := map[string]bool{}
		require.NoError(t, json.Unmarshal([]byte(raw), &overrides))
		require.Equal(t, true, overrides["panelTitleSearch"])
	})
}
