require File.join(File.dirname(__FILE__), 'test_helper')
require 'open_social_container/configurator'

class ConfiguratorTest < Test::Unit::TestCase
  # Replace this with your real tests.
  def test_person_class
    assert OpenSocialContainer::Configuration.respond_to?(:person_class)
  end
  
  def test_secret
    assert OpenSocialContainer::Configuration.respond_to?(:secret)
  end
  
  def test_app_domain
    assert OpenSocialContainer::Configuration.respond_to?(:app_domain)
  end
end
