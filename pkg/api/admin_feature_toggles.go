package api

import (
	"context"
	"fmt"
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

type adminFeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	ReadOnly        bool   `json:"readOnly"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	RequiresRestart bool   `json:"requiresRestart"`
	FrontendOnly    bool   `json:"frontendOnly"`
}

type updateFeatureTogglesCommand struct {
	Toggles []updateFeatureToggleCommand `json:"toggles"`
}

type updateFeatureToggleCommand struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

func (hs *HTTPServer) AdminListFeatureToggles(c *contextmodel.ReqContext) response.Response {
	manager, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature toggle manager does not support runtime changes", nil)
	}

	return response.JSON(http.StatusOK, getAdminFeatureToggleDTOs(c.Req.Context(), manager))
}

func (hs *HTTPServer) AdminUpdateFeatureToggles(c *contextmodel.ReqContext) response.Response {
	manager, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature toggle manager does not support runtime changes", nil)
	}

	cmd := updateFeatureTogglesCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	flagsByName := map[string]featuremgmt.FeatureFlag{}
	for _, flag := range manager.GetFlags() {
		flagsByName[flag.Name] = flag
	}

	for _, toggle := range cmd.Toggles {
		flag, ok := flagsByName[toggle.Name]
		if !ok {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("Feature toggle %q does not exist", toggle.Name), nil)
		}
		if flag.RequiresRestart || !manager.CanSetEnabled(toggle.Name) {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("Feature toggle %q cannot be changed at runtime", toggle.Name), nil)
		}
	}

	for _, toggle := range cmd.Toggles {
		if !manager.SetEnabled(toggle.Name, toggle.Enabled) {
			return response.Error(http.StatusBadRequest, fmt.Sprintf("Feature toggle %q cannot be changed at runtime", toggle.Name), nil)
		}
	}

	return response.JSON(http.StatusOK, getAdminFeatureToggleDTOs(c.Req.Context(), manager))
}

func getAdminFeatureToggleDTOs(ctx context.Context, manager *featuremgmt.FeatureManager) []adminFeatureToggleDTO {
	flags := manager.GetFlags()
	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	enabled := manager.GetEnabled(ctx)
	toggles := make([]adminFeatureToggleDTO, 0, len(flags))
	for _, flag := range flags {
		toggles = append(toggles, adminFeatureToggleDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			Enabled:         enabled[flag.Name],
			ReadOnly:        !manager.CanSetEnabled(flag.Name),
			RequiresDevMode: flag.RequiresDevMode,
			RequiresRestart: flag.RequiresRestart,
			FrontendOnly:    flag.FrontendOnly,
		})
	}

	return toggles
}
