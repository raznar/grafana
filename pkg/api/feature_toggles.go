package api

import (
	"net/http"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

// FeatureToggleMetadataItem is a subset of feature flag metadata for the Labs UI.
type FeatureToggleMetadataItem struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Stage        string `json:"stage"`
	FrontendOnly bool   `json:"frontendOnly"`
	Expression   string `json:"expression"`
}

// FeatureToggleMetadataResponse is returned by GET /api/feature-toggles/metadata.
type FeatureToggleMetadataResponse struct {
	Items []FeatureToggleMetadataItem `json:"items"`
}

// GetFeatureTogglesMetadata returns feature toggle definitions (excluding restart-required and hidden flags).
func (hs *HTTPServer) GetFeatureTogglesMetadata(c *contextmodel.ReqContext) {
	c, span := hs.injectSpan(c, "api.GetFeatureTogglesMetadata")
	defer span.End()

	list, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		c.JsonApiErr(http.StatusInternalServerError, "Failed to load feature toggles", err)
		return
	}

	items := filterFeatureToggleMetadata(list)
	resp := FeatureToggleMetadataResponse{Items: items}
	c.JSON(http.StatusOK, resp)
}

func filterFeatureToggleMetadata(list featuretoggleapi.FeatureList) []FeatureToggleMetadataItem {
	out := make([]FeatureToggleMetadataItem, 0, len(list.Items))
	for _, f := range list.Items {
		if f.DeletionTimestamp != nil {
			continue
		}
		if f.Spec.RequiresRestart || f.Spec.HideFromDocs {
			continue
		}
		name := f.Name
		if name == "" {
			continue
		}
		out = append(out, FeatureToggleMetadataItem{
			Name:         name,
			Description:  f.Spec.Description,
			Stage:        f.Spec.Stage,
			FrontendOnly: f.Spec.FrontendOnly,
			Expression:   f.Spec.Expression,
		})
	}
	return out
}
