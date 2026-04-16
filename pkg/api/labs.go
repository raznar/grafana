package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type labsFeatureFlagDTO struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	Stage            string `json:"stage"`
	RequiresDevMode  bool   `json:"requiresDevMode"`
	FrontendOnly     bool   `json:"frontendOnly"`
	RequiresRestart  bool   `json:"requiresRestart"`
	Enabled          bool   `json:"enabled"`
}

// GetLabsFeatureFlags returns registered feature flags and their effective state for the current request.
// GET /api/user/labs/feature-flags
func (hs *HTTPServer) GetLabsFeatureFlags(c *contextmodel.ReqContext) response.Response {
	if !hs.Cfg.LabsUIEnabled() {
		return response.Error(http.StatusNotFound, "Labs is not enabled", nil)
	}

	enabledMap := hs.Features.GetEnabled(c.Req.Context())
	flags := featuremgmt.StandardFeatureFlags()
	out := make([]labsFeatureFlagDTO, 0, len(flags))
	for _, f := range flags {
		enabled, ok := enabledMap[f.Name]
		if !ok {
			enabled = false
		}
		out = append(out, labsFeatureFlagDTO{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			RequiresDevMode: f.RequiresDevMode,
			FrontendOnly:    f.FrontendOnly,
			RequiresRestart: f.RequiresRestart,
			Enabled:         enabled,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return response.JSON(http.StatusOK, out)
}
