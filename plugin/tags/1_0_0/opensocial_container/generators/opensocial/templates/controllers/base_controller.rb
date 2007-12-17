class Feeds::BaseController < ApplicationController
protected
  def person_class
    @person_class ||= OpenSocialContainer::Configuration.person_class.constantize
  end
  
  def person_in_context
      @person = person_class.find(get_person_id(params[:id]))
  end
  
  def get_person_id(person_id)
    if person_id =~ /^VIEWER/
      session[:viewer_id]
    elsif person_id =~ /^OWNER/
      session[:owner_id]
    else
      person_id
    end
  end
end