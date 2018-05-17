#!/bin/bash

kill -HUP $(ps -ax | grep "hot-restarter" | head -n1 | awk '{print $1}')
