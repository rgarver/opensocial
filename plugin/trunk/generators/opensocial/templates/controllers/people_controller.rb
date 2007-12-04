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
end
