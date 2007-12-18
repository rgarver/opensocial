class OpensocialAssetsGenerator < Rails::Generator::Base
  attr_reader :destination_directory
  
  def initialize(runtime_args, runtime_options = {})
    @destination_directory = 'public/javascripts/opensocial/container'
    super
  end
  
  def manifest
    record do |m|
      m.directory destination_directory
      m.template 'OpensocialReference.js', File.join(destination_directory, 'OpensocialReference.js')
      m.template 'ig_base.js', File.join(destination_directory, 'ig_base.js')
    end
  end
end