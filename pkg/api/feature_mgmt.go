package api

import (
	"fmt"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

type featureMgmtGetDTO struct {
	Toggles          []featuremgmt.FlagStatus `json:"toggles"`
	RestartRequired  bool                     `json:"restartRequired"`
}

type featureMgmtPostDTO struct {
	Updates          []featureMgmtUpdate      `json:"updates"`
	RemoveOverrides  []string                 `json:"removeOverrides"`
}

type featureMgmtUpdate struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

func (hs *HTTPServer) getFeatureManager() *featuremgmt.FeatureManager {
	fm, _ := hs.Features.(*featuremgmt.FeatureManager)
	return fm
}

// swagger:route GET /featuremgmt getFeatureMgmtAdmin
//
// Feature management (Labs): list feature toggles and override state.
//
// Responses:
// 200: featureMgmtGetDTO
func (hs *HTTPServer) GetFeatureMgmtAdmin(c *contextmodel.ReqContext) response.Response {
	fm := hs.getFeatureManager()
	if fm == nil || hs.featureToggleOverrides == nil {
		return response.Error(http.StatusInternalServerError, "feature toggle service unavailable", nil)
	}

	m, err := hs.featureToggleOverrides.List(c.Req.Context())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to list feature toggle overrides", err)
	}
	fm.ReplaceDBOverridesCache(m)

	dto := featureMgmtGetDTO{
		Toggles:         fm.GetAllFlagsWithStatus(),
		RestartRequired: fm.RestartRequiredForOverrides(),
	}
	return response.JSON(http.StatusOK, dto)
}

// swagger:route POST /featuremgmt updateFeatureMgmtAdmin
//
// Feature management (Labs): upsert or remove persisted overrides. Requires Grafana restart to apply.
//
// Responses:
// 200: featureMgmtGetDTO
func (hs *HTTPServer) UpdateFeatureMgmtAdmin(c *contextmodel.ReqContext) response.Response {
	fm := hs.getFeatureManager()
	if fm == nil || hs.featureToggleOverrides == nil {
		return response.Error(http.StatusInternalServerError, "feature toggle service unavailable", nil)
	}

	var body featureMgmtPostDTO
	if err := web.Bind(c.Req, &body); err != nil {
		return response.Error(http.StatusBadRequest, "invalid JSON body", err)
	}

	userID := c.SignedInUser.UserID

	for _, name := range body.RemoveOverrides {
		if name == "" {
			continue
		}
		if !fm.HasFlag(name) {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("unknown feature toggle: %s", name), nil)
		}
		if fm.HasIniEntry(name) {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("toggle %s is set in config and cannot be changed from Labs", name), nil)
		}
		if err := hs.featureToggleOverrides.Delete(c.Req.Context(), name); err != nil {
			return response.Error(http.StatusInternalServerError, "failed to remove override", err)
		}
	}

	for _, u := range body.Updates {
		if u.Name == "" {
			return response.Error(http.StatusBadRequest, "update name is required", nil)
		}
		if !fm.HasFlag(u.Name) {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("unknown feature toggle: %s", u.Name), nil)
		}
		if fm.HasIniEntry(u.Name) {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("toggle %s is set in config and cannot be changed from Labs", u.Name), nil)
		}
		if err := hs.featureToggleOverrides.Upsert(c.Req.Context(), u.Name, u.Enabled, userID); err != nil {
			return response.Error(http.StatusInternalServerError, "failed to save override", err)
		}
	}

	m, err := hs.featureToggleOverrides.List(c.Req.Context())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to list feature toggle overrides", err)
	}
	fm.ReplaceDBOverridesCache(m)

	out := featureMgmtGetDTO{
		Toggles:         fm.GetAllFlagsWithStatus(),
		RestartRequired: fm.RestartRequiredForOverrides(),
	}
	return response.JSON(http.StatusOK, out)
}
