class OpensocialAssetsGenerator < Rails::Generator::Base
  attr_reader :destination_directory
  
  def initialize(runtime_args, runtime_options = {})
    @destination_directory = 'public/javascripts/opensocial/container'
    super
  end
  
  def manifest
    record do |m|
      m.directory destination_directory
      %w(opensocial collection container bodytype email enum idspec mediaitem message name navigationparameters organization phone address person activity environment datarequest dataresponse responseitem).each do |j|
        m.file "#{j}.js", File.join(destination_directory, "#{j}.js")
      end
      m.template 'rails_container.js', File.join(destination_directory, 'rails_container.js')
    end
  end
end