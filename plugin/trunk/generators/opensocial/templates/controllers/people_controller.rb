class Feeds::PeopleController < Feeds::BaseController
  before_filter :person_in_context, :only => [:show, :friends]
  
  # GET /feeds_peoples/1/friends
  # GET /feeds_peoples/1/friends.xml
  def friends
    @friends = @person.friends

    respond_to do |format|
      format.xml
    end
  end

  # GET /feeds_peoples/1
  # GET /feeds_peoples/1.xml
  def show
    respond_to do |format|
      format.xml
    end
  end
  
private
  def person_class
    @person_class ||= OpenSocialContainer::Configuration.person_class.constantize
  end
  
  def person_in_context
    if params[:id] =~ /^VIEWER/
      @person = person_class.find(session[:viewer_id])
    elsif params[:id] =~ /^OWNER/
      @person = person_class.find(session[:owner_id])
    else
      @person = person_class.find(params[:id])
    end
  end
end
