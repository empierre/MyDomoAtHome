#!/bin/sh
# if your application is not installed in @INC path:
export PERL5LIB='/path/to/your/application/lib'
exec 2>&1 \
 sudo -u www-data plackup -E production -s Starman --workers=3 -p 5001  -a bin/app.pl
