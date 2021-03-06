package main

//This file contains the go:generate commands

//go-raml https://github.com/Jumpscale/go-raml server code generation from the RAML specification
//go:generate go-raml server --ramlfile specifications/api/users.raml --dir identityservice/user --package user --no-main
//go:generate go-raml server --ramlfile specifications/api/companies.raml --dir identityservice/company --package company --no-main
//go:generate go-raml server --ramlfile specifications/api/organizations.raml --dir identityservice/organization --package organization --no-main
//go:generate go-raml server --ramlfile specifications/api/contracts.raml --dir identityservice/contract --package contract --no-main
//go:generate go-raml server --ramlfile specifications/api/userorganizations.raml --dir identityservice/userorganization --package userorganization --no-main

//go:generate go-bindata -pkg specifications -prefix specifications/api -o specifications/packaged.go specifications/api/...
