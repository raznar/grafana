package navtreeimpl

import (
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
)

func (s *ServiceImpl) getLabsNode(c *contextmodel.ReqContext) *navtree.NavLink {
	if !c.HasRole(identity.RoleAdmin) {
		return nil
	}

	return &navtree.NavLink{
		Text:     "Labs",
		SubTitle: "Experimental features and feature flags",
		Id:       navtree.NavIDCfgLabs,
		Url:      s.cfg.AppSubURL + "/admin/labs",
		Icon:     "flask",
	}
}
