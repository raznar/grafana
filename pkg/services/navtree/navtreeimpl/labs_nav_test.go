package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/accesscontrol/actest"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/org"
	pref "github.com/grafana/grafana/pkg/services/preference"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	"github.com/grafana/grafana/pkg/services/star"
	"github.com/grafana/grafana/pkg/services/star/startest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetNavTree_IncludesLabsForSignedInUser(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.ProfileEnabled = false

	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		IsSignedIn: true,
		SignedInUser: &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleViewer,
		},
		Context: &web.Context{Req: httpReq},
	}

	starService := startest.NewStarServiceFake()
	starService.ExpectedUserStars = &star.GetUserStarsResult{
		UserStars: map[string]bool{},
	}

	s := &ServiceImpl{
		cfg:            cfg,
		log:            log.New("navtree-test"),
		accessControl:  actest.FakeAccessControl{ExpectedEvaluate: true},
		pluginStore:    &pluginstore.FakePluginStore{},
		pluginSettings: &pluginsettings.FakePluginSettings{},
		starService:    starService,
		features:       featuremgmt.WithFeatures(),
		license:        &licensing.OSSLicensingService{},
		authnService:   &authntest.FakeService{ExpectedIdentity: &authn.Identity{ID: "1"}},
	}
	s.readNavigationSettings()

	tree, err := s.GetNavTree(reqCtx, &pref.Preference{})
	require.NoError(t, err)

	labs := tree.FindById(navtree.NavIDLabs)
	require.NotNil(t, labs, "Labs nav link should be present for signed-in users")
	require.Equal(t, "Labs", labs.Text)
	require.Equal(t, "flask", labs.Icon)
	require.Equal(t, "/labs", labs.Url)
	require.Equal(t, int64(navtree.WeightLabs), labs.SortWeight)
}
