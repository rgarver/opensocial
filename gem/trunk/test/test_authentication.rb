require File.dirname(__FILE__) + '/test_helper.rb'

class TestAuthentication < Test::Unit::TestCase
  def setup
    @url = 'https://orkut.com/feeds/'
    @username = 'foo'
    @password = 'notwhatyouthink'
    OpenSocial::API::Source.company = 'ELC Technologies'
    OpenSocial::API::Source.application = 'Testing'
    OpenSocial::API::Source.version = '1'
  end
  
  def test_setting_source
    assert_equal 'ELCTechnologies-Testing-1', OpenSocial::API::Source.to_s
  end
  
  def test_client_login_authentication_success
    Net::HTTP::Post.any_instance.expects(:form_data=).with({:Email => @username, :Passwd => @password, 
      :source => 'ELCTechnologies-Testing-1', :service => 'ot', :accountType => 'HOSTED_OR_GOOGLE'})
    response = stub(:code => '200', :body => "SID=SIDTOKEN\nLSID=LSIDTOKEN\nAuth=AUTHTOKEN")
    google_http = Net::HTTP.new('www.google.com', 443)
    google_http.expects(:use_ssl=).with(true)
    Net::HTTP.expects(:new).with('www.google.com', 443).returns(google_http)
    Net::HTTP.any_instance.expects(:request).with do |req|
      req.path == '/accounts/ClientLogin' && 
      req.method == 'POST'
    end.returns(response)
    
    impl = OpenSocial::API::Implementor.new(@url)
    
    assert impl.client_login(@username, @password)
    assert_equal 'GoogleLogin auth=AUTHTOKEN', impl.authorization
  end
  
  def test_client_login_authentication_failure
    Net::HTTP::Post.any_instance.expects(:form_data=).with({:Email => @username, :Passwd => @password, 
      :source => 'ELCTechnologies-Testing-1', :service => 'ot', :accountType => 'HOSTED_OR_GOOGLE'})
    response = stub(:code => '403', :body => "Error=BadAuthentication")
    google_http = Net::HTTP.new('www.google.com', 443)
    google_http.expects(:use_ssl=).with(true)
    Net::HTTP.expects(:new).with('www.google.com', 443).returns(google_http)
    Net::HTTP.any_instance.expects(:request).with do |req|
      req.path == '/accounts/ClientLogin' && 
      req.method == 'POST'
    end.returns(response)
    
    impl = OpenSocial::API::Implementor.new(@url)
    
    assert !impl.client_login(@username, @password)
    assert_nil impl.authorization
    assert_equal 'BadAuthentication', impl.error['Error']
  end
  
  def test_authsub_proxy_authentication
    impl = OpenSocial::API::Implementor.new(@url)
    next_addr = "http://www.return.com/me/here"
    redirect = impl.authsub_proxy(next_addr, :session => 1, :secure => 0)
    
    redirect_params = CGI.parse(URI.parse(redirect).query)
    assert_equal ['1'], redirect_params['session']
    assert_equal ['0'], redirect_params['secure']
    assert_equal [next_addr], redirect_params['next']
    assert_equal [@url], redirect_params['scope']
  end
  
  # person = orkut.people.find(:me) # => OpenSocial::Person
  #  person.friends # => [OpenSocial::Person]
  #  person.activities # => [OpenSocial::Activities]
  
  # socket = StringIO.new("HTTP/1.1 200 OK\n\nSID\nLSID\nAUTH")
  # TCPSocket.stubs(:open).returns(socket)
  # OpenSSL::SSL::SSLSocket.stubs(:new).returns(socket)
end