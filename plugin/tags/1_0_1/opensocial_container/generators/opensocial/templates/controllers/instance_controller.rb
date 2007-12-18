class Feeds::InstanceController < Feeds::BaseController
  before_filter :instantiate_app_and_person
  
  def index
    @persistences = Feeds::Instance.find(:all, 
                  :conditions => {:app_id => @app.id, 
                                  :person_id => @person.id})
                                  
    respond_to do |format|
      format.xml
    end
  end
  
  def show
    @persistence = Feeds::Instance.find(:first, 
                  :conditions => {:app_id => @app.id, 
                                  :person_id => @person.id,
                                  :key => params[:id]})
    
    respond_to do |format|
      format.xml
    end
  end
  
  def update
  end
  
  def create
    xml = URI.decode(request.raw_post)
    @persistence = Feeds::Instance.create_from_atom(xml, :app_id => @app.id, :person_id => @person.id)
    
    respond_to do |format|
      format.xml { render :status => 201, :action => 'show' }
    end
  end
  
  private
    def instantiate_app_and_person
      @app = Feeds::App.find(params[:app_id])
      @person = self.person_class.find(get_person_id(params[:persistence_id]))
    end
end