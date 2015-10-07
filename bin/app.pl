#!/usr/bin/env perl
use FindBin;
use Cwd qw/realpath/;
use Dancer ':script';

#tell the Dancer where the app lives
my $appdir=realpath( "$FindBin::Bin/..");

Dancer::Config::setting('appdir',$appdir);
Dancer::Config::load();

use Domo;
dance;
