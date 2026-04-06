package api

import (
	"encoding/json"
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type featureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	ReadOnly        bool   `json:"readOnly"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
}

func (hs *HTTPServer) AdminGetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	mgr, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	flags := mgr.GetFlags()
	enabled := mgr.GetEnabled(c.Req.Context())

	dtos := make([]featureToggleDTO, 0, len(flags))
	for _, f := range flags {
		dto := featureToggleDTO{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Enabled:         enabled[f.Name],
			ReadOnly:        f.RequiresRestart,
			RequiresDevMode: f.RequiresDevMode,
			RequiresRestart: f.RequiresRestart,
			FrontendOnly:    f.FrontendOnly,
		}
		dtos = append(dtos, dto)
	}

	sort.Slice(dtos, func(i, j int) bool {
		return dtos[i].Name < dtos[j].Name
	})

	return response.JSON(http.StatusOK, dtos)
}

type updateFeatureToggleRequest struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

type updateFeatureTogglesRequest struct {
	Toggles []updateFeatureToggleRequest `json:"toggles"`
}

func (hs *HTTPServer) AdminUpdateFeatureToggles(c *contextmodel.ReqContext) response.Response {
	mgr, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	var req updateFeatureTogglesRequest
	if err := json.NewDecoder(c.Req.Body).Decode(&req); err != nil {
		return response.Error(http.StatusBadRequest, "Invalid request body", err)
	}

	for _, toggle := range req.Toggles {
		if !mgr.SetEnabled(toggle.Name, toggle.Enabled) {
			return response.Error(http.StatusBadRequest, "Cannot update toggle: "+toggle.Name, nil)
		}
	}

	return response.Success("Feature toggles updated")
}
