package identityservice

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"github.com/itsyouonline/identityserver/db"
	userdb "github.com/itsyouonline/identityserver/db/user"
	companydb "github.com/itsyouonline/identityserver/db/company"
	organizationdb "github.com/itsyouonline/identityserver/db/organization"
	"github.com/itsyouonline/identityserver/globalconfig"
	"github.com/itsyouonline/identityserver/identityservice/company"
	"github.com/itsyouonline/identityserver/identityservice/organization"
	"github.com/itsyouonline/identityserver/identityservice/user"
	"github.com/itsyouonline/identityserver/identityservice/userorganization"

	"crypto/rand"
	"encoding/base64"

	log "github.com/Sirupsen/logrus"
	"github.com/itsyouonline/identityserver/communication"
	"github.com/itsyouonline/identityserver/validation"
)

//Service is the identityserver http service
type Service struct {
	smsService                   communication.SMSService
	phonenumberValidationService *validation.IYOPhonenumberValidationService
}

//NewService creates and initializes a Service
func NewService(smsService communication.SMSService) (service *Service) {
	service = &Service{smsService: smsService}
	p := &validation.IYOPhonenumberValidationService{SMSService: smsService}
	service.phonenumberValidationService = p
	return
}

//AddRoutes registers the http routes with the router.
func (service *Service) AddRoutes(router *mux.Router) {
	// User API
	user.UsersInterfaceRoutes(router, user.UsersAPI{SmsService: service.smsService, PhonenumberValidationService: service.phonenumberValidationService})
	userdb.InitModels()

	// Company API
	company.CompaniesInterfaceRoutes(router, company.CompaniesAPI{})
	companydb.InitModels()

	// Organization API
	organization.OrganizationsInterfaceRoutes(router, organization.OrganizationsAPI{})
	userorganization.UsersusernameorganizationsInterfaceRoutes(router, userorganization.UsersusernameorganizationsAPI{})
	organizationdb.InitModels()

}

func generateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)

	// Note that err == nil only if we read len(b) bytes.
	if err != nil {
		return nil, err
	}

	return b, nil
}

// Generate a random string (s length) used for secret cookie
func generateCookieSecret(s int) (string, error) {
	b, err := generateRandomBytes(s)
	return base64.URLEncoding.EncodeToString(b), err
}

// GetCookieSecret gets the cookie secret from mongodb if it exists otherwise, generate a new one and save it
func GetCookieSecret() string {
	session := db.GetSession()
	defer session.Close()

	config := globalconfig.NewManager()
	globalconfig.InitModels()

	cookie, err := config.GetByKey("cookieSecret")
	if err != nil {
		log.Debug("No cookie secret found, generating a new one")

		secret, err := generateCookieSecret(32)

		if err != nil {
			log.Panic("Cannot generate secret cookie")
		}

		cookie.Key = "cookieSecret"
		cookie.Value = secret

		err = config.Insert(cookie)

		// Key was inserted by another instance in the meantime
		if db.IsDup(err) {
			cookie, err = config.GetByKey("cookieSecret")

			if err != nil {
				log.Panic("Cannot retreive cookie secret")
			}
		}
	}

	log.Debug("Cookie secret: ", cookie.Value)

	return cookie.Value
}

//FilterAuthorizedScopes filters the requested scopes to the ones that are authorizated, if no authorization exists, authorizedScops is nil
func (service *Service) FilterAuthorizedScopes(r *http.Request, username string, grantedTo string, requestedscopes []string) (authorizedScopes []string, err error) {
	authorization, err := userdb.NewManager(r).GetAuthorization(username, grantedTo)
	if authorization == nil || err != nil {
		return
	}

	authorizedScopes = authorization.FilterAuthorizedScopes(requestedscopes)

	return
}

//FilterPossibleScopes filters the requestedScopes to the relevant ones that are possible
// For example, a `user:memberof:orgid1` is not possible if the user is not a member the `orgid1` organization
func (service *Service) FilterPossibleScopes(r *http.Request, username string, clientID string, requestedScopes []string) (possibleScopes []string, err error) {
	possibleScopes = make([]string, 0, len(requestedScopes))
	orgmgr := organizationdb.NewManager(r)
	for _, rawscope := range requestedScopes {
		scope := strings.TrimSpace(rawscope)
		if strings.HasPrefix(scope, "user:memberof:") {
			orgid := strings.TrimPrefix(scope, "user:memberof:")
			isMember, err := orgmgr.IsMember(orgid, username)
			if err != nil {
				return nil, err
			}
			if isMember {
				possibleScopes = append(possibleScopes, scope)
				continue
			}
			isOwner, err := orgmgr.IsOwner(orgid, username)
			if err != nil {
				return nil, err
			}
			if isOwner {
				possibleScopes = append(possibleScopes, scope)
			}
		} else {
			possibleScopes = append(possibleScopes, scope)
		}
	}
	return
}

// GetOauthSecret gets the oauth secret from mongodb for a specified service. If it doesn't exist, an error gets logged.
func GetOauthSecret(service string) (string, error) {
	session := db.GetSession()
	defer session.Close()

	config := globalconfig.NewManager()
	globalconfig.InitModels()
	secretModel, err := config.GetByKey(service + "-secret")
	if err != nil {
		log.Errorf("No Oauth secret found for %s. Please insert it into the collection globalconfig with key %s-secret",
			service, service)
	}
	return secretModel.Value, err
}

// GetOauthClientID gets the oauth secret from mongodb for a specified service. If it doesn't exist, an error gets logged.
func GetOauthClientID(service string) (string, error) {
	session := db.GetSession()
	defer session.Close()

	config := globalconfig.NewManager()
	globalconfig.InitModels()

	clientIDModel, err := config.GetByKey(service + "-clientid")
	log.Warn(clientIDModel.Value)
	if err != nil {
		log.Errorf("No Oauth client id found for %s. Please insert it into the collection globalconfig with key %s-clientid",
			service, service)
	}
	return clientIDModel.Value, err
}
