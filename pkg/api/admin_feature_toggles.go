package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

type featureToggleDTO struct {
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
	Toggles []featureToggleUpdate `json:"toggles"`
}

type featureToggleUpdate struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

func (hs *HTTPServer) AdminGetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm := hs.FeatureManager
	if fm == nil {
		return response.Error(http.StatusInternalServerError, "Feature manager not available", nil)
	}

	flags := fm.GetFlags()
	enabled := fm.GetEnabled(c.Req.Context())

	dtos := make([]featureToggleDTO, 0, len(flags))
	for _, f := range flags {
		readOnly := f.RequiresRestart
		if f.RequiresDevMode && hs.Cfg.Env == setting.Prod {
			readOnly = true
		}
		dtos = append(dtos, featureToggleDTO{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Enabled:         enabled[f.Name],
			ReadOnly:        readOnly,
			RequiresDevMode: f.RequiresDevMode,
			RequiresRestart: f.RequiresRestart,
			FrontendOnly:    f.FrontendOnly,
		})
	}

	sort.Slice(dtos, func(i, j int) bool {
		return dtos[i].Name < dtos[j].Name
	})

	return response.JSON(http.StatusOK, dtos)
}

func (hs *HTTPServer) AdminUpdateFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm := hs.FeatureManager
	if fm == nil {
		return response.Error(http.StatusInternalServerError, "Feature manager not available", nil)
	}

	cmd := updateFeatureTogglesCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "Bad request data", err)
	}

	if len(cmd.Toggles) == 0 {
		return response.Error(http.StatusBadRequest, "No toggles provided", nil)
	}

	for _, t := range cmd.Toggles {
		if ok := fm.SetEnabled(t.Name, t.Enabled); !ok {
			return response.Error(http.StatusBadRequest,
				"Cannot update toggle: "+t.Name+" (it may not exist, require a restart, or require dev mode)", nil)
		}
	}

	return response.JSON(http.StatusOK, map[string]string{"message": "Feature toggles updated"})
}
