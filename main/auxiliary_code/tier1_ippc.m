function [C CO2eq C_std CO2eq_std C_dist CO2eq_dist] = tier1_ippc(BAtundra, BAboreal, niter)


% random seed
rand('seed',12345);
randn('seed',12345);

% average emission factors 
GefCO2mean = mean([1073 1380 1400]); % (g kg−1) taken from Odintsovo, Pskov, and Alaska (Watson2019)
GefCO2std = std([1073 1380 1400]);
GefCH4mean = mean([3.20 6.94 5.69]); % (g kg−1) taken from Alaska (Watson2019)
GefCH4std = std([3.20 6.94 5.69]);

h = waitbar(0,'Please wait...');

CO2eq_dist = nan(niter,length(BAtundra));
C_dist = nan(niter,length(BAtundra));

warning('off')
for iter = 1:niter

    % normErrors: // 1 MbTundra // 2 MbBoreal // 3 GefCO2 // 4 GefCH4 // 5 BAestimation
    
    if iter == 1 % first iteration estimates the mean CO2-eq
        normErrors = [0 0 0 0 0];
    else % then, error propagation
        normErrors = [normrnd(0,1) normrnd(0,1) normrnd(0,1) normrnd(0,1) normrnd(0,1)];
    end

    % define parameters
    GefCO2 = GefCO2mean+GefCO2std*normErrors(3); 
    GefCH4 = GefCH4mean+GefCH4std*normErrors(4);
    MbCTundra = 1.99+1.31*normErrors(1); % (kg C/m2) taken from tundra in NorthAmerica (Veraverbeke2021)
    MbCBoreal = 3.36+0.93*normErrors(2); % (kg C/m2) taken from Cajander larch (Veraverbeke2021)

    % convert C to dry matter (*2 accprdomg to ipcc2014)
    MbDMTundra = MbCTundra*2;
    MbDMBoreal = MbCBoreal*2;

    % estimate C and CO2-eq in Tg (=Mt)
    C_ii = (MbCTundra.*BAtundra + MbCBoreal.*BAboreal)*1000/100;
    CO2 = (MbDMTundra.*BAtundra + MbDMBoreal.*BAboreal)*GefCO2/100;
    CH4 = (MbDMTundra.*BAtundra + MbDMBoreal.*BAboreal)*GefCH4/100;
    CO2eq_ii = CO2 + CH4.*25; 

    CO2eq_ii = CO2eq_ii + CO2eq_ii*0.11 + CO2eq_ii*0.04*normErrors(5); 
    C_ii = C_ii + C_ii*0.11 + C_ii*0.4*normErrors(5); 
    
    % concatenate
    CO2eq_dist(iter,:) = CO2eq_ii;
    C_dist(iter,:) = C_ii;
    
    waitbar(iter/niter,h)
end
warning('on')
close(h)


C = C_dist(1,:);
C_std = nanstd(C_dist);

CO2eq = CO2eq_dist(1,:);
CO2eq_std = nanstd(CO2eq_dist);

% % doublecheck results
% figure, bar([nanmean(CO2eq_dist)' CO2eq_dist(1,:)']);
% figure, hist(CO2eq_dist(:,end),100)
% 
% display(' ')
% display(['Year 2020: C = ' num2str(C(end)) '(sd = ' num2str(C_std(end)) ')'])
% display(['Year 2020: CO2-eq = ' num2str(CO2eq(end)) '(sd = ' num2str(CO2eq_std(end)) ')'])
% display(' ')



