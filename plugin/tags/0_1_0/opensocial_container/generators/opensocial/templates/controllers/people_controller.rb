class Feeds::PeopleController < Feeds::BaseController
  # GET /feeds_peoples/1/friends
  # GET /feeds_peoples/1/friends.xml
  def friends
    @feeds_peoples = self.class.ar_source.find(:all)

    respond_to do |format|
      format.xml  { render :xml => @feeds_peoples }
    end
  end

  # GET /feeds_peoples/1
  # GET /feeds_peoples/1.xml
  def show
    params[:id] = 1 if params[:id] =~ /OWNER|VIEWER/
    @person = person_class.send "find_by_#{person_class.opensocial_id_column_name}", params[:id]

    respond_to do |format|
      format.xml
    end
  end
  
private
  def person_class
    @person_class ||= OpenSocialContainer::Configuration.person_class.constantize
  end
end
