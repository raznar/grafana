package navtreeimpl

import (
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
)

func (s *ServiceImpl) getLabsNode(c *contextmodel.ReqContext) *navtree.NavLink {
	hasAccess := ac.HasAccess(s.accessControl, c)
	if !hasAccess(ac.EvalPermission(ac.ActionFeatureManagementRead)) {
		return nil
	}

	return &navtree.NavLink{
		Text:     "Labs",
		SubTitle: "Experimental features and feature flags",
		Id:       navtree.NavIDCfgLabs,
		Url:      s.cfg.AppSubURL + "/admin/labs",
		Icon:     "rocket",
	}
}
