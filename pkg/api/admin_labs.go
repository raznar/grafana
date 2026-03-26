package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	common "github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/web"
)

type updateLabsFeatureToggleCommand struct {
	Enabled bool `json:"enabled"`
}

func (hs *HTTPServer) AdminGetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	if !c.GetIsGrafanaAdmin() {
		return response.Error(http.StatusForbidden, "Grafana server admin access required", nil)
	}

	if hs.featureManager == nil {
		return response.Error(http.StatusNotImplemented, "Feature manager is not available", nil)
	}

	states := hs.featureManager.GetToggleStates()
	result := featuretoggleapi.ResolvedToggleState{
		AllowEditing: true,
		Enabled:      hs.featureManager.GetEnabled(c.Req.Context()),
		Toggles:      make([]featuretoggleapi.ToggleStatus, 0, len(states)),
	}

	for _, state := range states {
		toggle := featuretoggleapi.ToggleStatus{
			Name:        state.Flag.Name,
			Description: state.Flag.Description,
			Stage:       state.Flag.Stage.String(),
			Enabled:     state.Enabled,
			Writeable:   state.Writeable,
			Warning:     state.Warning,
		}

		if state.Source != "default" {
			source := state.Source
			toggle.Source = &common.ObjectReference{
				Name: source,
			}
		}

		if state.Flag.RequiresRestart && state.HasOverride {
			result.RestartRequired = true
		}

		result.Toggles = append(result.Toggles, toggle)
	}

	return response.JSON(http.StatusOK, result)
}

func (hs *HTTPServer) AdminUpdateLabsFeatureToggle(c *contextmodel.ReqContext) response.Response {
	if !c.GetIsGrafanaAdmin() {
		return response.Error(http.StatusForbidden, "Grafana server admin access required", nil)
	}

	if hs.featureManager == nil {
		return response.Error(http.StatusNotImplemented, "Feature manager is not available", nil)
	}

	cmd := updateLabsFeatureToggleCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	flag := web.Params(c.Req)[":flag"]
	if flag == "" {
		return response.Error(http.StatusBadRequest, "feature flag is required", nil)
	}

	nextOverrides, err := hs.featureManager.OverridesAfterSet(flag, cmd.Enabled)
	if err != nil {
		return response.Error(http.StatusBadRequest, fmt.Sprintf("failed to update feature flag %q", flag), err)
	}

	payload, err := json.Marshal(nextOverrides)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to persist feature flag override", err)
	}

	if err := hs.labsOverrideStore().Set(c.Req.Context(), "overrides", string(payload)); err != nil {
		return response.Error(http.StatusInternalServerError, "failed to persist feature flag override", err)
	}

	if err := hs.featureManager.SetOverride(flag, cmd.Enabled); err != nil {
		return response.Error(http.StatusBadRequest, fmt.Sprintf("failed to update feature flag %q", flag), err)
	}

	return hs.AdminGetLabsFeatureToggles(c)
}
