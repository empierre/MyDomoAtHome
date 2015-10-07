#!/usr/bin/env perl
use strict;
use warnings;
use Dancer2;
use FindBin;
use Cwd qw/realpath/;
use lib "$FindBin::Bin/../lib";

use Domo2;
Domo2->to_app;


