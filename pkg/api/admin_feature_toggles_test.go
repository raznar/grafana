package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

func TestAdminGetFeatureToggles(t *testing.T) {
	mgr := featuremgmt.WithManager("testFeature1", "testFeature2", false)

	hs := &HTTPServer{
		Features: mgr,
	}

	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/feature-toggles", nil)
	c := &contextmodel.ReqContext{
		Context: &web.Context{Req: req, Resp: web.NewResponseWriter(http.MethodGet, recorder)},
	}

	resp := hs.AdminGetFeatureToggles(c)
	require.Equal(t, http.StatusOK, resp.Status())

	body := resp.Body()
	var toggles []featureToggleDTO
	err := json.Unmarshal(body, &toggles)
	require.NoError(t, err)
	require.Len(t, toggles, 2)

	toggleMap := make(map[string]featureToggleDTO)
	for _, toggle := range toggles {
		toggleMap[toggle.Name] = toggle
	}

	assert.True(t, toggleMap["testFeature1"].Enabled)
	assert.False(t, toggleMap["testFeature2"].Enabled)
}

func TestAdminUpdateFeatureToggles(t *testing.T) {
	mgr := featuremgmt.WithManager("testFeature1", "testFeature2", false)

	hs := &HTTPServer{
		Features: mgr,
	}

	body, err := json.Marshal(updateFeatureTogglesRequest{
		Toggles: []updateFeatureToggleRequest{
			{Name: "testFeature2", Enabled: true},
		},
	})
	require.NoError(t, err)

	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/api/admin/feature-toggles", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c := &contextmodel.ReqContext{
		Context: &web.Context{Req: req.WithContext(context.Background()), Resp: web.NewResponseWriter(http.MethodPut, recorder)},
	}

	resp := hs.AdminUpdateFeatureToggles(c)
	require.Equal(t, http.StatusOK, resp.Status())

	assert.True(t, mgr.IsEnabledGlobally("testFeature2"))
}
