clear all; close all;

load('./DATA/STATS_ERA5hourly_ignitions','META','OUT')

OUT(sum(isnan(OUT),2)>0,:) = [];
Ws = sqrt(OUT(:,4).^2 + OUT(:,5).^2);
Wd = mod(180+180/pi.*atan2(OUT(:,4),OUT(:,5)),360);
OUT(:,3) = OUT(:,3).*1000;

%% MAIN PLOT

figure, 
subplot(2,2,1)
plot(OUT(:,2),OUT(:,1)./1000,'.k')
xlabel('Maximum air temperature (°C)'), ylabel('Burned area (ha x 10^3)')
set(gca, 'YGrid', 'on', 'XGrid', 'on')

subplot(2,2,2)
plot(OUT(:,3),OUT(:,1)./1000,'.k')
xlabel('Total precipitation (mm)'), ylabel('Burned area (ha x 10^3)')
% set(gca,'XLim',[0 360],'XTick',0:90:360)
set(gca, 'YGrid', 'on', 'XGrid', 'on')

subplot(2,2,3)
plot(Ws,OUT(:,1)./1000,'.k')
xlabel('Wind speed (m^2/s)'), ylabel('Burned area (ha x 10^3)')
set(gca,'XLim',[0 10],'XTick',0:2:10)
set(gca, 'YGrid', 'on', 'XGrid', 'on')

subplot(2,2,4)
plot(Wd,OUT(:,1)./1000,'.k')
xlabel('Wind direction (°)'), ylabel('Burned area (ha x 10^3)')
set(gca,'XLim',[0 360],'XTick',0:90:360)
set(gca, 'YGrid', 'on', 'XGrid', 'on')

% SAVE IMAGE as it appear on screen
set(gcf, 'PaperPositionMode', 'auto')
saveas(gcf,['./figures/era5_during_fire_event.svg'])


%% OTHER PLOTS

th = 4000
ind = OUT(:,1)>th;
figure, 
subplot(2,2,1)
hist(OUT(ind,2),50)
xlabel('Maximum air temperature (°C)'), ylabel('Frequency')

subplot(2,2,2)
hist(OUT(ind,3),50)
xlabel('Total precipitation 10-d before ignition (mm)'), ylabel('Frequency')

subplot(2,2,3)
hist(Ws(ind),50)
xlabel('Wind speed (m^2/s)'), ylabel('Frequency')

subplot(2,2,4)
hist(Wd(ind),50)
xlabel('Wind direction (0 North - 90 East - 180 South - 270 West)'), ylabel('Frequency')

set(gca,'XLim',[0 360],'XTick',0:90:360)
set(gca, 'YGrid', 'off', 'XGrid', 'on')
title('')

sgtitle(['Fire events >' num2str(th) ' ha'])



ind = OUT(:,1)<th;
figure, 
subplot(2,2,1)
hist(OUT(ind,2),50)
xlabel('Maximum air temperature (°C)'), ylabel('Frequency')

subplot(2,2,2)
hist(OUT(ind,3),50)
xlabel('Total precipitation 10-d before ignition (mm)'), ylabel('Frequency')

subplot(2,2,3)
hist(Ws(ind),50)
xlabel('Wind speed (m^2/s)'), ylabel('Frequency')

subplot(2,2,4)
hist(Wd(ind),50)
xlabel('Wind direction (0 North - 90 East - 180 South - 270 West)'), ylabel('Frequency')
 
set(gca,'XLim',[0 360],'XTick',0:90:360)
set(gca, 'YGrid', 'off', 'XGrid', 'on')

sgtitle(['Fire events <' num2str(th) ' ha'])


%% STATS

th = 4000; %prctile(OUT(:,1),90)
ind = OUT(:,1)>th;

% Ratios
sum(ind)./length(ind)
sum(OUT(ind,1))./sum(OUT(:,1))

% TEMPERATURE

mean(OUT(ind,2))
std(OUT(ind,2))

mean(OUT(not(ind),2))
std(OUT(not(ind),2))

ttest2(OUT(ind,2),OUT(not(ind),2))

% Rainfall
mean(OUT(ind,3))
std(OUT(ind,3))

mean(OUT(not(ind),3))
std(OUT(not(ind),3))

ttest2(OUT(ind,3),OUT(not(ind),3))

% Wind speed
mean(Ws(ind))
std(Ws(ind))

mean(Ws(not(ind)))
std(Ws(not(ind)))

figure, hold on
histogram(Ws(ind))
histogram(Ws(not(ind)))

ttest2(Ws(ind),Ws(not(ind)))

% Wind direction
mean(Wd(ind))
std(Wd(ind))

mean(Wd(not(ind)))
std(Wd(not(ind)))

figure, hold on
histogram(Wd(ind))
histogram(Wd(not(ind)))

ttest2(Wd(ind),Wd(not(ind)))


