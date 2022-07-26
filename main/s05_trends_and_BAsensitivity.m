clear all; close all

addpath('./auxiliary_code')

%%
% Climate-vegetation trends
T = readtable('./DATA/ARCTIC_TRENDS_Ta_LST_LSTera5_Rf_Vcomp_Ucomp_Vpd_Cwd_SoS_EoS_NDVI_v3-3.csv');

% Ignitions
IGN = readtable(['./DATA/modis_2001-2020_Russian_Federation_ignitions_v1-1.csv']);
indOk = IGN.lat>66.5 & IGN.lon>85;
IGN(not(indOk),:) = [];
Count = [];
for ii = 2001:2020
    Count = [Count; sum(IGN.year==ii & IGN.status==1)];
end
year = (2001:2020)';
I = table(year,Count);

% Burned area
BA = readtable('./DATA/BA_Arctic_allSatellites_v1-4.csv');
BAdata = table2array(BA(:,2:7))'./1000000;
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAmedian = nanmedian(BAdata);


%%
T.Ws = sqrt(T.Vcomp.^2 + T.Ucomp.^2);
T.Wd = mod(180+180/pi.*atan2(T.Vcomp,T.Ucomp),360);
T.LoS = T.EoS-T.SoS;

%% save merged layer for SEM
variables = T.Properties.VariableNames;
OUT = T(20:end,[find(strcmp(variables,'year')) ...
    find(strcmp(variables,'Ta')) ...
    find(strcmp(variables,'LST')) ...
    find(strcmp(variables,'vpd')) ...
    find(strcmp(variables,'Rf')) ...
    find(strcmp(variables,'Ws')) ...
    find(strcmp(variables,'Wd')) ...
    find(strcmp(variables,'SoS')) ...
    find(strcmp(variables,'LoS')) ...
    find(strcmp(variables,'ndvi')) ...
    find(strcmp(variables,'def')) ...
    ]);

Ign = I.Count;
BA = BAmedian(:,20:end)';
BAlog = log(BA);
OUT = [OUT array2table(Ign) array2table(BA) array2table(BAlog)];
if 1
    writetable(OUT,'./DATA/ARCTIC_TRENDS_merged_v3-3.csv')
end

%%
% BA = log(BAmedian);
BA = BAmedian;
BA(isnan(BA)) = 0;
BA(isinf(BA)) = 0;

%% 
% VAR = {'Count','Ws','Wd','Rf','LST','vpd','def','ndvi'}; %,'Ws'
% VARnames = {'IGN','Wind speed','Wind direction','Rf','LST','VPD','PET-AET','GR'};
% 
% VARnamesLong = {'Fire hazards','Wind speed','Wind direction','Surface temperature', ...
%     'Vapor pressure deficit','Plant water deficit','Greening (maximum NDVI)','Greening (maximum NDVI)'};
% UNITS = {'Number of ignitions','m s^-1','°','m s^-1','kPa','mm','1','d'};

%% 
VAR = {'Count','Ta','Rf','LST','vpd','def','ndvi','LoS'}; %,'Ws'
VARnames = {'IGN','Ta','Rf','LST','VPD','PET-AET','GR','LoS'};

VARnamesLong = {'Fire hazards','Air temperature','Total precipitation','Surface temperature', ...
    'Vapor pressure deficit','Plant water deficit','Greening (maximum NDVI)','Length of Season'};
UNITS = {'Number of ignitions','°C','mm','m·s^-1','kPa','mm','1','d'};


%% TRENDS
STATS = [];

hf = figure('units','normalized','outerposition',[0 0 0.3 1]);
for ivar = 1:length(VAR)

if strcmp(VAR{ivar},'Count')
    Y = I.Count;
    X = I.year;
elseif strcmp(VAR{ivar},'LST')
    Y = T.([VAR{ivar}]);
    X = T.year;
    Y = Y(20:end);
    X = X(20:end);
else
    Y = T.([VAR{ivar}]);
    X = T.year;
end

funcType = {'poly1','poly2','exp1'};
[f gof] = fit(X, Y, 'poly1' );

lm = fitlm(X,Y);
pvalue = lm.Coefficients.pValue(2)


R2 = gof.rsquare; 
[R pvalR] = corrcoef(f(X),Y);
R2 = R(1,2)^2;
pvalR = pvalR(1,2);

STATS = [STATS; f.p1 f.p2 R2 pvalue pvalR];

indMax = 1;

ha(ivar) = subplot(4,2,ivar), hold on,
plot(X, Y, '.k','MarkerSize',8)
xlim([1980 2022])
plot(f,'r')
% plot( f{indMax}, X, Y)
xlabel(' ')
ylabel([VARnames{ivar} ' (' UNITS{ivar} ')'])
legend('hide')

set(gca,'XLim',[1980 2020],'XTick',1980:5:2020)
set(gca,'XTickLabelRotation',45)
set(gca, 'YGrid', 'off', 'XGrid', 'on')
xlim([1980 2022])
box on

if strcmp(VAR{ivar},'SoS')
inc1 = (max(Y)-min(Y))*0.25;
inc2 = (max(Y)-min(Y))*0.05;
elseif strcmp(VAR{ivar},'Rf') | strcmp(VAR{ivar},'Ws') 
inc1 = (max(Y)-min(Y))*0.05;
inc2 = (max(Y)-min(Y))*0.35;
else
inc1 = (max(Y)-min(Y))*0.05;
inc2 = (max(Y)-min(Y))*0.2;
end

ylim([min(Y)-inc1 max(Y)+inc2])

% title({[VAR{ivar} ' Best fit: ' funcType{indMax} ], ...
%     ['  R^2=' num2str(R2*100,'%4.2f') '  p-value~' num2str(pvalue,'%4.3f')]})
title([VARnamesLong{ivar}])

set(gca,'FontName','Arial');
end

pos = get(ha, 'position');
dim = cellfun(@(x) x.*[1 1 1 1], pos, 'uni',0);
for ii = 1:length(VAR)
    
    if STATS(ii,1)>0
        symb = '+';
    else
        symb = '-';
    end
    
    if strcmp(VAR{ii},'SoS')
        positionText = 'bottom';
    else
        positionText = 'top';
    end
    
    if STATS(ii,4)<0.01
        isSignificant = '**';
    elseif STATS(ii,4)>0.05
        isSignificant = '';
    else
        isSignificant = '*';
    end
    
    if STATS(ii,5)<0.01
        isSignificantR = '**';
    elseif STATS(ii,5)>0.05
        isSignificantR = ' ';
    else
        isSignificantR = '*';
    end

    str=['{\it R^2} = ',num2str(STATS(ii,3),'%4.2f'),newline,...
        'Slope = ',num2str((STATS(ii,1)*10),'%4.3f'),isSignificant];

    a = annotation(hf, 'textbox', dim{ii}, 'String', str, 'EdgeColor','none', 'verticalalignment', positionText);
    a.FontSize = 8;
    a.FontName = 'Arial';
    
    
end


%% TREND TA
figure,
xlim([1980 2050])
ivar = 2;
Y = T.([VAR{ivar}]);
X = T.year;
 
funcType = {'poly1','poly2','exp1'};
[f gof] = fit(X, Y, 'poly1' );

lm = fitlm(X,Y);
pvalue = lm.Coefficients.pValue(2)


R2 = gof.rsquare; 
[R pvalR] = corrcoef(f(X),Y);
R2 = R(1,2)^2;
pvalR = pvalR(1,2);


indMax = 1;

hold on,
plot(X, Y, '.k')
% xlim([1980 2022])
plot(f,'r')
% plot( f{indMax}, X, Y)
xlabel(' ')
ylabel([VARnames{ivar} ' (' UNITS{ivar} ')'])
legend('hide')
yline(Y(end))
yline(9.929)
% set(gca,'XLim',[1980 2020],'XTick',1980:5:2020)
% set(gca,'XTickLabelRotation',45)
% set(gca, 'YGrid', 'off', 'XGrid', 'on')

box on


%% Ratio BA/meanBA

figure, 
plot(X, BA/mean(BA), '.k')
yline(1,'r')
grid on
ylabel('BA/mean(BA)')
title('Ratio BA/meanBA')


%% BA vs OTHER
for isDetrend = [0 1]
    STATS = [];
hf = figure('units','normalized','outerposition',[0 0 0.3 1]);
for ivar = 1:length(VAR)

if strcmp(VAR{ivar},'Count')
    X = I.Count;
    Y = BA((end-19):end)';
    YEARS = I.year;
elseif strcmp(VAR{ivar},'LST')
    X = T.([VAR{ivar}]);
    X = X(19:end);
    Y = BA((end-20):end)';
    YEARS = (2000:2020)';
else
    X = T.([VAR{ivar}]);
    Y = BA';
    YEARS = T.year;
end


if isDetrend
    fYY = fit(YEARS, X, 'poly1' );
    X = X-fYY(YEARS);
    sgtitle('DETRENDED')
else
    sgtitle('NOT DETRENDED')
end





if 1
    funcType = {'poly1','exp1'};
    fitType = {'linear', 'exponential'};

    [f1 gof1] = fit(X, Y, 'poly1' )
    [fe gofe] = fit(X, Y, 'exp1');
    f = {f1,fe};
    [R2 indMax] = max([gof1.rsquare gofe.rsquare]); 

    confit = predint(f{indMax},sort(X),0.95,'functional','on');
else
    funcType = {'poly1','poly2','exp1'};
    fitType = {'linear', 'quadratic', 'exponential'};

    [f1 gof1] = fit(X, Y, 'poly1' )
    [f2 gof2] = fit(X, Y, 'poly2' )
    [fe gofe] = fit(X, Y, 'exp1');
    f = {f1,f2,fe};
    [R2 indMax] = max([gof1.rsquare gof2.rsquare gofe.rsquare]); 

    confit = predint(f{indMax},sort(X),0.95,'functional','on');
end

[R pvalR] = corrcoef(f{indMax}(X),Y);
R2 = R(1,2)^2;
pvalR = pvalR(1,2);

STATS = [STATS; indMax R2 pvalR];

ha(ivar) = subplot(4,2,ivar), hold on %%%%%%%%%%%%%

% xlim([1980 2022])
% plot(f{indMax},'r')

if pvalR>0.01
    colorfit = [0.7,0.7,0.7];
    colorfitCI=colorfit;
else
    colorfit = 'r';
    colorfitCI = [1,0.7,0.7];
end

incSim = (max(X)-min(X))*0.01;
xsim = (min(X)-incSim*10):incSim:(max(X)+incSim*10);
plot(xsim,f{indMax}(xsim),'Color',colorfit)

cpred = predint(f{indMax},xsim,0.95,'Functional');
cinte = confint(f{indMax},0.95)
plot(xsim,cpred(:,1),'--','Color',colorfitCI)
plot(xsim,cpred(:,2),'--','Color',colorfitCI)
plot(X, Y, '.k','MarkerSize',8)


if strcmp(VAR{ivar},'Count')
    labelpoints(X, Y,2001:2020,'outliers_lim', {[0, 5.1]; 'and'}); hold on;
elseif strcmp(VAR{ivar},'LST')
    labelpoints(X, Y,2000:2020,'outliers_lim', {[0, 5.1]; 'and'}); hold on;
else
    labelpoints(X, Y,1982:2020,'outliers_lim', {[0, 5.1]; 'and'}); hold on;
end

% plot(sort(X),confit,'k--')
title([VARnamesLong{ivar}])
ylabel('Burned area (Mha)')
xlabel([VARnames{ivar} ' (' UNITS{ivar} ')'])

legend('hide')
box on


inc1 = (max(Y)-min(Y))*0.05;
inc2 = (max(Y)-min(Y))*0.2;
ylim([min(Y)-inc1 max(Y)+inc2])

inc1 = (max(X)-min(X))*0.1;
inc2 = (max(X)-min(X))*0.1;
xlim([min(X)-inc1 max(X)+inc2])


set(gca,'FontName','Arial');
end



pos = get(ha, 'position');
dim = cellfun(@(x) x.*[1 1 1 1], pos, 'uni',0);
for ii = 1:length(VAR)
    
    
    STATS(ii,3)
    
    if strcmp(VAR{ii},'SoS')
        positionText = 'right';
    else
        positionText = 'left';
    end
    
    if STATS(ii,3)<0.01
        isSignificantR = '**';
    elseif STATS(ii,3)>0.05
        isSignificantR = ' ';
    else
        isSignificantR = '*';
    end
    
        display('blabla')
    VAR{ii}
    STATS(ii,2)
    
    display('blabla')
    
    str=['{\it R^2} = ',num2str(STATS(ii,2),'%4.2f'),isSignificantR,newline,...
        'Best fit: ' fitType{STATS(ii,1)}];

    a = annotation(hf, 'textbox', dim{ii}, 'String', str, 'EdgeColor','none', 'horizontalalignment', positionText);
    a.FontSize = 8;
    a.FontName = 'Arial';
end

display('STATS__________________')
STATS
display('__________________')
end
% ivar = 2;
% x1 = T.([VAR{ivar}]);
% ivar = 3;
% x2 = T.([VAR{ivar}]);
% 












