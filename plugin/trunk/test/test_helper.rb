ENV['RAILS_ENV'] = 'test'
require File.join(File.dirname(__FILE__), '..', '..', '..', '..', 'config', 'environment')
require 'test_help'
require 'mocha'
require 'stubba'

$:.unshift File.join(File.dirname(__FILE__), '..', 'lib')