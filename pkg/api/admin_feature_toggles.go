package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type AdminFeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	DefaultEnabled  bool   `json:"defaultEnabled"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	RequiresDevMode bool   `json:"requiresDevMode"`
}

func (hs *HTTPServer) AdminGetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	enabled := hs.Features.GetEnabled(c.Req.Context())
	flags := featuremgmt.GetRegisteredFeatureFlags()

	toggles := make([]AdminFeatureToggleDTO, 0, len(flags))
	for _, flag := range flags {
		toggles = append(toggles, AdminFeatureToggleDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			Enabled:         enabled[flag.Name],
			DefaultEnabled:  flag.Expression == "true",
			FrontendOnly:    flag.FrontendOnly,
			RequiresRestart: flag.RequiresRestart,
			RequiresDevMode: flag.RequiresDevMode,
		})
	}

	sort.Slice(toggles, func(i, j int) bool {
		return toggles[i].Name < toggles[j].Name
	})

	return response.JSON(http.StatusOK, toggles)
}
