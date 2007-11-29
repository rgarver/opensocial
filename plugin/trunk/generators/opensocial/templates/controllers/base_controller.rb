class Feeds::BaseController < ApplicationController
protected
  def person_class
    @person_class ||= OpenSocialContainer::Configuration.person_class.constantize
  end
end