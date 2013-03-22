Summary: Backup/restore middleware and cli
Name: the-vault
Version: 0.8.1
Release: 1
License: LGPL21
Group: System Environment/Tools
URL: https://github.com/nemomobile/the-vault
Source0: %{name}-%{version}.tar.bz2
BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-buildroot
Requires: cutes >= 0.7.4
Requires: cutes-js >= 0.7.5
Requires: qtscriptbindings-core
BuildRequires: cmake

%description
Library and command line application providing backup/restore
framework. It uses approach somehow similar to git-annex to use git to
handle changes and separately manage blobs. Additionally to command
line interface it provides QtScript API

%package examples
Summary: Examples of backup scripts
Group: System Environment/Libraries
Requires: the-vault
%description examples
Examples of backup scripts

%define jslibdir %{_datadir}/cutes

%prep
%setup -q

%build
%cmake
make %{?jobs:-j%jobs}

%install
rm -rf %{buildroot}
make install  DESTDIR=%{buildroot}

install -d -D -p -m755 %{buildroot}%{_datadir}/the-vault/
install -d -D -p -m755 %{buildroot}%{_datadir}/the-vault/examples/

install -D -p -m755 examples/scripts/pictures.js %{buildroot}%{_datadir}/the-vault/examples/

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_datadir}/cutes/vault/*.js

%files examples
%defattr(-,root,root,-)
%{_datadir}/the-vault/examples/*.js

%post examples
cutes /usr/share/cutes/vault/vault-cli.js -G -a register --data=name=picture,group=media,icon=icon-launcher-gallery,script=%{_datadir}/the-vault/examples/pictures.js

