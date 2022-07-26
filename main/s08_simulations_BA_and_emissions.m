clear all; close all

addpath('./auxiliary_code')

plotResults = false;
saveresults = true;
niter = 10^3;

MODE = {'OBS','RCP45','RCP85'};

for imode = 1:length(MODE)

TREND_BA = [];
TREND_BApeat = [];
TREND_BAtundra = [];
TREND_BApeattundra = [];

%% load data for model

% Trends
T = readtable('./DATA/ARCTIC_TRENDS_Ta_LST_LSTera5_Rf_Vcomp_Ucomp_Vpd_Cwd_SoS_EoS_NDVI_v3-3.csv');

IGN = readtable(['./DATA/modis_2001-2020_Russian_Federation_ignitions_v1-1.csv']);
indOk = IGN.lat>66.5 & IGN.lon>85;
IGN(not(indOk),:) = [];
Count = [];
for ii = 2001:2020
    Count = [Count; sum(IGN.year==ii & IGN.status==1)];
end
year = (2001:2020)';
I = table(year,Count);


% ERA5 ignition data
ERA5 = readtable('./DATA/Arctic_ignitions_monthly_2001-2020_ERA_TA-RF-VPD-LST_v1-1.csv');
ERA5 = ERA5(:,2:end-1);

ERA = readtable('./DATA/BA_Arctic_FIRMS_perimeters_v1');
ERA = ERA(:,2:end-1);
ERA(ERA.BurnedArea==0 | ERA.n_firms<0, :) = [];
ERA.BAlog = log(ERA.BurnedArea);

OUT = [];
for ii = 1:height(ERA)
    Ti = ERA(ii,:);
    ERA5i = ERA5(Ti.fireid==ERA5.fireid & Ti.year==ERA5.yy,[5 6:11]);
    OUT = [OUT; [Ti ERA5i(1,:)]];
end

ERA = OUT;




%% Create models

% model ignitions
X = T.Ta(20:end);
Y = (I.Count);

% figure, hist(log(I.Count),10)
% figure, hist(I.Count,10)
% figure, hist(log(X),10)

mdlIgn = fitlm(X,Y);

figure, hold on
plot(mdlIgn)
xlabel('Temperature')
ylabel('Ignitions')

% model BA
x =ERA.temperature_2m;
y = ERA.BAlog;
indnan = isnan(x) | isnan(y);
x(indnan) = [];
y(indnan) = [];
mdlBA = fit(x,y,'exp1');


%% load data for predictions

% Ignition occurrence
OCC = double(imread('./DATA/ignitions_2001-2020_mean_spatialmean_spatialstd_01degrees.tif'));
% figure, imagesc(OCC(1:70,:,1))
OCCmean0 = OCC(:,:,2);
OCCmean0 = OCCmean0(:);


% ROI Arctic
ROI = imread('./DATA/roi_arctic_01degrees.tif');
% ROI(:,500:523) = 0;
lagIgn = 0;
% figure, imagesc(ROI(1:70,:,1))
ROI = ROI(:)==1;




% peatlands SOC
PEAT0 = imread('./DATA/peatland_SOC_01degrees.tif');
% figure, imagesc(PEAT(1:70,:,1))
PEAT0 = PEAT0(:);

% peatlands SOC
TUNDRA0 = imread('./DATA/roi_arctic_biomes_01degrees.tif');
% figure, imagesc(TUNDRA0(1:70,:,1))
TUNDRA0 = TUNDRA0(:) == 2;


if strcmp(MODE{imode},'OBS')
    years = 1982:2020;

    % ERA5 mean summer TA
    TAall = (double(imread('./DATA/ERA5_TA_1982-2020_01degrees.tif'))./1000);
    TAall(TAall==0) = NaN;
    TAall = TAall-273.15;
    % figure, imagesc(TA(1:70,:,1))
    
    init = 1981;
elseif strcmp(MODE{imode},'RCP45')
    load('.\DATA\TAS_summer_gridded_hadgem2-cc_rcp45_r1i1p1_1950-2100.mat')

    years = 1950:2100;
    % RCP mean summer TA
    TAall = double(ta)./1000;
    TAall(TAall==0) = NaN;
    TAall = TAall-273.15;
    TAall = [TAall; zeros(266,720,151)];
    % figure, imagesc(TA(1:70,:,1))
    
    init = 1949;
elseif strcmp(MODE{imode},'RCP85')

    load('.\DATA\TAS_summer_gridded_hadgem2-cc_rcp85_r1i1p1_1950-2100.mat')

    years = 1950:2100;
    % RCP mean summer TA
    TAall = double(ta)./1000;
    TAall(TAall==0) = NaN;
    TAall = TAall-273.15;
    TAall = [TAall; zeros(266,720,151)];
    % figure, imagesc(TA(1:70,:,1))
    
    init = 1949;
end

for yy = years;

TA = TAall(:,:,yy-init);
TA = TA(:);


%% Sort out NaN
indOK = not(isnan(OCCmean0)) & not(isnan(TA)) & ROI;

TA = TA(indOK);
OCCmean = OCCmean0(indOK);
PEAT = PEAT0(indOK);
TUNDRA = TUNDRA0(indOK);

%% Input model
TaSummer = nanmean(TA); %11.5;
OCCdens = OCCmean./sum(OCCmean);

%% Predict
annualBA = [];
annualBApeat = [];
annualBAtundra = [];
annualBApeattundra = [];
annualIGN = [];

for iter = 1:niter
    

%% model ignitions
[YpredMean,ci2] = predict(mdlIgn,TaSummer,'Alpha',0.5,'Simultaneous',true);
Ypred = YpredMean+sum(ci2(2)-ci2(1)).*normrnd(0,1)/2;

if Ypred < 0
    Ypred = 0; 
end

nignitions = round(Ypred);
nignitions = nignitions-lagIgn;
if nignitions<0
    nignitions = 0;
end
    

annualIGN = [annualIGN nignitions];


%% model BA
A = nan(1,nignitions);


% method1
% randNum1 = rand(length(OCCdens),1);
% indIgnitions = randi(length(TA),1,nignitions);

% method2
% randNum1 = rand(length(OCCdens),1);
% [bla indIgnitions] = sort(OCCdens,'descend');
% indIgnitions = indIgnitions(1:nignitions);

% method3
randNum1 = rand(length(OCCdens),1);
ignprob = OCCdens.*randNum1;
[bla indIgnitions] = sort(ignprob,'descend');
indIgnitions = indIgnitions(1:nignitions);

% method4 // method 3 but with permutation and including TA
% indIgnitions = nan(nignitions,1);
% randNum1 = rand(length(OCCdens),nignitions);
% for ii = 1:nignitions
%     randNum1i = randNum1(:,ii);
%     ignprob = OCCdens.*randNum1i;
%     [bla indmaxprob] = max(ignprob);
% end
% unique(indIgnitions)


randNum2 = normrnd(0,1,nignitions,1);

TaEvent2 = TA(indIgnitions);
p12 = predint(mdlBA,TaEvent2,0.5,'observation','on');
YpredMean = mdlBA(TaEvent2);
Ypred = YpredMean+(p12(:,2)-p12(:,1)).*randNum2/2;

Ypred(Ypred<0) = 0;

ba_event = exp(Ypred);


ba_event(ba_event>140000) = 140000;

% figure, hold on
% plot(ERA.temperature_2m,ERA.BurnedArea,'.b')
% plot(TaEvent2,ba_event,'or');

annualBA = [annualBA sum(ba_event)./1000000];
%  iter

PEATign = PEAT(indIgnitions);
TUNDRAign = TUNDRA(indIgnitions);

annualBApeat = [annualBApeat sum(ba_event(PEATign>200))./1000000];
annualBAtundra = [annualBAtundra sum(ba_event(TUNDRAign))./1000000];
annualBApeattundra = [annualBApeattundra sum(ba_event(PEATign>200 & TUNDRAign))./1000000];

 end

%% summary
% annualBA = annualBA+annualBA*0.15;

if plotResults

    figure, hist(annualBA,50)

    pause
    close all
end

display(' ')
display(['Year:' num2str(yy)])
display(['TaSummer:' num2str(TaSummer) '  TaEvent: ' num2str(mean(TaEvent2))])
display(['Ignitions:' num2str(mean(annualIGN)) '  sd:' num2str(std(annualIGN))])
display(['Annual BA:' num2str(mean(annualBA)) '  sd:' num2str(std(annualBA))])
display(' ')

TREND_BA = [TREND_BA; median(annualBA) std(annualBA) median(annualIGN) std(annualIGN)];
TREND_BApeat = [TREND_BApeat; median(annualBApeat) std(annualBApeat)]; 
TREND_BAtundra = [TREND_BAtundra; median(annualBAtundra) std(annualBAtundra)]; 
TREND_BApeattundra = [TREND_BApeattundra; median(annualBApeattundra) std(annualBApeattundra)]; 



end

%% estimate carbon emissions
% ALL carbon emissions
BAall = TREND_BA(:,1);
BAtundra = TREND_BAtundra(:,1);
BAboreal = BAall-BAtundra;
%figure, bar([BAboreal; BAtundra]')

[C CO2eq C_std CO2eq_std C_dist CO2eq_dist] = tier1_ippc(BAtundra, BAboreal, niter);

% % doublecheck results
% figure, bar([nanmean(CO2eq_dist)' CO2eq_dist(1,:)']);
% figure, hist(CO2eq_dist(:,end),100)

% ALL carbon emissions
BAallpeat = TREND_BApeat(:,1);
BApeattundra = TREND_BApeattundra(:,1);
BApeatboreal = BAallpeat-BApeattundra;
%figure, bar([BAboreal; BAtundra]')

[Cpeat CO2eqpeat C_stdpeat CO2eq_stdpeat C_distpeat CO2eq_distpeat] = tier1_ippc(BApeattundra, BApeatboreal, niter);


%% save results
if saveresults
    OUT = array2table([TREND_BA C' C_std' CO2eq' CO2eq_std']);
    OUT.Properties.VariableNames = {'BA_median','BA_std','IGN_median','IGN_std','C','C_std','CO2eq','CO2eq_std'};
    writetable(OUT,['./DATA/' MODE{imode} '_all_simulations_results_v1.csv'])
    
    OUTpeat = array2table([TREND_BApeat Cpeat' C_stdpeat' CO2eqpeat' CO2eq_stdpeat']);
    OUTpeat.Properties.VariableNames = {'BA_median','BA_std','C','C_std','CO2eq','CO2eq_std'};
    writetable(OUTpeat,['./DATA/' MODE{imode} '_peat_simulations_results_v1.csv'])
end

figure,
shadedErrorBar(years,TREND_BA(:,3),TREND_BA(:,4)*2,'lineProps','k');
ylabel('Count ignitions (1)')


figure,
shadedErrorBar(years,TREND_BA(:,1),TREND_BA(:,2)*2,'lineProps','k');
shadedErrorBar(years,TREND_BApeat(:,1),TREND_BApeat(:,2)*2,'lineProps','g');
ylabel('Burned area ALL&PEAT (Mha)')
yline(1)

figure,
shadedErrorBar(years,CO2eq,CO2eq_std*2,'lineProps','k');
shadedErrorBar(years,CO2eqpeat,CO2eq_stdpeat*2,'lineProps','g');
ylabel('CO2-eq ALL&PEAT (Tg)')

close all

end














