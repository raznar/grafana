package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/overrides"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestFeatureMgmtAPI(t *testing.T) {
	sqlStore := db.InitTestDB(t)
	cfg := setting.NewCfg()
	fm, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)
	svc := overrides.ProvideService(sqlStore)
	require.NoError(t, fm.ReloadDatabaseOverrides(context.Background(), svc))

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Cfg = cfg
		hs.Features = fm
		hs.SQLStore = sqlStore
		hs.featureToggleOverrides = svc
	})

	t.Run("GET forbidden without permission", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/featuremgmt/"),
			userWithPermissions(1, []accesscontrol.Permission{{Action: "invalid.action"}}),
		)
		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("GET returns toggles with read permission", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/featuremgmt/"),
			userWithPermissions(1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementRead}}),
		)
		res, err := server.SendJSON(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		var body featureMgmtGetDTO
		require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
		require.NotEmpty(t, body.Toggles)
		require.NoError(t, res.Body.Close())
	})

	t.Run("POST forbidden without write permission", func(t *testing.T) {
		payload := strings.NewReader(`{"updates":[{"name":"panelTitleSearch","enabled":true}]}`)
		req := webtest.RequestWithSignedInUser(
			server.NewPostRequest("/api/featuremgmt/", payload),
			userWithPermissions(1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementRead}}),
		)
		res, err := server.SendJSON(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("POST succeeds with write permission", func(t *testing.T) {
		payload := strings.NewReader(`{"updates":[{"name":"panelTitleSearch","enabled":true}]}`)
		req := webtest.RequestWithSignedInUser(
			server.NewPostRequest("/api/featuremgmt/", payload),
			authedUserWithPermissions(1, 1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementWrite}}),
		)
		res, err := server.SendJSON(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		var body featureMgmtGetDTO
		require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
		var found bool
		for _, tg := range body.Toggles {
			if tg.Name == featuremgmt.FlagPanelTitleSearch {
				found = true
				require.True(t, tg.HasOverride)
			}
		}
		require.True(t, found)
		require.NoError(t, res.Body.Close())
	})
}
