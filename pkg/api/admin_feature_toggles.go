package api

import (
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
	Owner           string `json:"owner,omitempty"`
	Enabled         bool   `json:"enabled"`
	DefaultEnabled  bool   `json:"defaultEnabled"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
}

type featureTogglesResponse struct {
	Items []featureToggleDTO `json:"items"`
}

func (hs *HTTPServer) AdminGetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature toggles", err)
	}

	enabled := hs.Features.GetEnabled(c.Req.Context())
	items := make([]featureToggleDTO, 0, len(featureList.Items))
	seen := make(map[string]struct{}, len(featureList.Items))

	for _, feature := range featureList.Items {
		if feature.DeletionTimestamp != nil || feature.Name == "" {
			continue
		}

		seen[feature.Name] = struct{}{}
		items = append(items, featureToggleDTO{
			Name:            feature.Name,
			Description:     feature.Spec.Description,
			Stage:           feature.Spec.Stage,
			Owner:           feature.Spec.Owner,
			Enabled:         enabled[feature.Name],
			DefaultEnabled:  feature.Spec.Expression == "true",
			RequiresRestart: feature.Spec.RequiresRestart,
			FrontendOnly:    feature.Spec.FrontendOnly,
		})
	}

	for name := range enabled {
		if _, ok := seen[name]; ok {
			continue
		}

		items = append(items, featureToggleDTO{
			Name:    name,
			Stage:   "unknown",
			Enabled: true,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Name < items[j].Name
	})

	return response.JSON(http.StatusOK, featureTogglesResponse{Items: items})
}
