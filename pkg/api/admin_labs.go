package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type FeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Enabled         bool   `json:"enabled"`
	Stage           string `json:"stage"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
}

func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager not available", nil)
	}

	flags := fm.GetFlags()
	enabled := hs.Features.GetEnabled(c.Req.Context())

	dtos := make([]FeatureToggleDTO, 0, len(flags))
	for _, flag := range flags {
		if flag.HideFromDocs {
			continue
		}

		dto := FeatureToggleDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Enabled:         enabled[flag.Name],
			Stage:           flag.Stage.String(),
			RequiresDevMode: flag.RequiresDevMode,
			RequiresRestart: flag.RequiresRestart,
			FrontendOnly:    flag.FrontendOnly,
		}
		dtos = append(dtos, dto)
	}

	sort.Slice(dtos, func(i, j int) bool {
		return dtos[i].Name < dtos[j].Name
	})

	return response.JSON(http.StatusOK, dtos)
}
