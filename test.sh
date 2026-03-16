override=''
if [ -e docker-compose.test.override.yml ]; then
  override='-f docker-compose.test.override.yml'
fi

docker-compose -p "$(basename $PWD|tr '[:upper:]' '[:lower:]')-test" -f docker-compose.test.yml $override up --build --abort-on-container-exit --exit-code-from testing-container 
EXITCODE=$?

docker-compose -p "$(basename $PWD|tr '[:upper:]' '[:lower:]')-test" -f docker-compose.test.yml $override down -v

exit $EXITCODE
