class Feeds::AppsController < Feeds::BaseController
  # GET /feeds_apps
  # GET /feeds_apps.xml
  def index
    @apps = Feeds::App.find(:all)

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @feeds_apps }
    end
  end

  # GET /feeds_apps/1
  # GET /feeds_apps/1.xml
  def show
    @app = Feeds::App.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @app }
    end
  end

  # GET /feeds_apps/new
  # GET /feeds_apps/new.xml
  def new
    @app = Feeds::App.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @app }
    end
  end

  # GET /feeds_apps/1/edit
  def edit
    @app = Feeds::App.find(params[:id])
  end

  # POST /feeds_apps
  # POST /feeds_apps.xml
  def create
    @app = Feeds::App.new(params[:feeds_app])

    respond_to do |format|
      if @app.save
        flash[:notice] = 'Feeds::App was successfully created.'
        format.html { redirect_to(@app) }
        format.xml  { render :xml => @app, :status => :created, :location => @app }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @app.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /feeds_apps/1
  # PUT /feeds_apps/1.xml
  def update
    @app = Feeds::App.find(params[:id])

    respond_to do |format|
      if @app.update_attributes(params[:feeds_app])
        flash[:notice] = 'Feeds::App was successfully updated.'
        format.html { redirect_to(@app) }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @app.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /feeds_apps/1
  # DELETE /feeds_apps/1.xml
  def destroy
    @app = Feeds::App.find(params[:id])
    @app.destroy

    respond_to do |format|
      format.html { redirect_to(feeds_apps_url) }
      format.xml  { head :ok }
    end
  end
end
