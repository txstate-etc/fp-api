#!/bin/sh

mongoimport --host mongodb --db facultyprofiles --collection people --drop --type json --file /people.json --jsonArray || exit $?
mongoimport --host mongodb --db facultyprofiles --collection activities --drop --type json --file /activities.json --jsonArray || exit $?
mongoimport --host mongodb --db facultyprofiles --collection faces --drop --type json --file /faces.json --jsonArray || exit $?

cp -R /seed-files/* /fp-files/
