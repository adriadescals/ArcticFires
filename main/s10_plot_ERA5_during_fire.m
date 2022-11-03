% Generate supplementary figure 9. Fig. S9. Local weather conditions in the
% fires detected in the Siberian Arctic during 2001-2020.

clear all; close all;

load('./DATA/STATS_ERA5hourly_ignitions','META','OUT') % load hourly data

OUT(sum(isnan(OUT),2)>0,:) = []; % filter out raws with no data
Ws = sqrt(OUT(:,4).^2 + OUT(:,5).^2); % calculate wind speed
Wd = mod(180+180/pi.*atan2(OUT(:,4),OUT(:,5)),360); % calculate wind direction
OUT(:,3) = OUT(:,3).*1000; % convert precipitation to mm

%% PLOT

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
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/era5_during_fire_event.svg'])


