require 'test/unit'
require 'rubygems'
require 'cgi'
require 'mocha'
require File.dirname(__FILE__) + '/../lib/opensocial'

class Test::Unit::TestCase
  def fixture_as_httpresponse(file, code = '200')
    body = File.read(File.join(File.dirname(__FILE__), 'fixtures', file))
    stub(:body => body, :code => code.to_s, :entity => body, :read_body => body)
  end
end