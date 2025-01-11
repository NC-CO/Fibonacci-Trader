import { Component, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as testData from '../assets/test.json';
import Chart from 'chart.js/auto';
import { DatePipe } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

interface Stock {
  value: string;
  viewValue: string;
}

interface TimeFrame {
  value: string;
  viewValue: string;
}

interface StockData {
  'Meta Data': {
      '1. Information': string;
      '2. Symbol': string;
      '3. Last Refreshed': string;
      '4. Interval': string;
      '5. Output Size': string;
      '6. Time Zone': string;
  };
  'Time Series (5min)': {
      [timestamp: string]: {
          '1. open': string;
          '2. high': string;
          '3. low': string;
          '4. close': string;
          '5. volume': string;
      };
  };
  'Time Series (Daily)': {
    [timestamp: string]: {
        '1. open': string;
        '2. high': string;
        '3. low': string;
        '4. close': string;
        '5. volume': string;
    };
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class AppComponent {
  public chart: any;
  datepipe: DatePipe = new DatePipe('en-US');
  userName: string = 'user69';
  title = 'Fibonacci-Trader';
  responseObject: JSON = <JSON>{};
  str: string = '';
  strr: string = '';
  jsonStuff: JSON = <JSON>{};
  //data: StockData = testData;
  array: Array<number> = [];
  arrayTuple: Array<{x:string, y:number}> = [];
  indexArr: Array<string> = [];
  valleyArray: Array<number> = []; 
  peakArray: Array<number> = [];
  timeFrame: string;
  selectedStock: string;
  interval: string;
  function: string;
  absoluteMax: number = 0;
  peakAndValleyArray: Array<{x:string, y:number}> = [];
  significantPoints: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean] = [[],[], false];
  bullishCrab: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bearishCrab: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bullishShark: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bearishShark: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bullishBat: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bearishBat: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  score = 0;
  datasets: Array<{label:string, data: Array<{x:string, y:number}>, borderColor: string, fill: boolean, backgroundColor: string, pointBackgroundColor: string, borderDash: [number, number]}> = [];

  constructor(private http: HttpClient, private cookieService: CookieService) {
    this.timeFrame = 'daily'; //daily or intraday
    this.selectedStock = 'aapl';
    this.interval = '5min';
    this.function = '';
  }
  public ngOnInit(): void {
    this.callAPI();
    const firstVisit = this.cookieService.get('firstVisit');
    if (!firstVisit) {
      this.cookieService.set('firstVisit', new Date().toUTCString(), { expires: 1095 });
      console.log('newbie');
    } else {
      console.log('back again');
    }
  }

  callAPI() {
    this.array = [];
    this.indexArr = [];
    this.peakAndValleyArray = [];
    this.arrayTuple = [];
    this.datasets = [];
    this.score = 0;
    this.bullishCrab = [[],[], false, 0];
    this.bearishCrab = [[],[], false, 0];
    this.bullishShark = [[],[], false, 0];
    this.bearishShark = [[],[], false, 0];
    this.bullishBat = [[],[], false, 0];
    this.bearishBat = [[],[], false, 0];
    let url  = '';
    if (this.timeFrame == 'daily') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ this.selectedStock }&apikey=3Q62PTYW8KBTOCQ2`;
    } else {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ this.selectedStock }&interval=${ this.interval }&entitlement=delayed&outputsize=compact&apikey=3Q62PTYW8KBTOCQ2`;
    }
    this.http.get<StockData>(url).subscribe((response) => {
      [this.array, this.indexArr] = this.jsonToArray(response);
      //console.log('this.array = '+this.array.length)
      for (let i = 0; i < this.array.length; i++) {
        this.arrayTuple.push({x:this.indexArr[i], y:this.array[i]});
      }
      this.peakAndValleyArray = this.peakAndValleyFinder();
      //this.significantPoints = this.fibonacciFinder(this.peakAndValleyArray);
      this.bullishCrab = this.bullishCrabFinder(this.peakAndValleyArray);
      this.bearishCrab = this.bearishCrabFinder(this.peakAndValleyArray);
      this.bullishShark = this.bullishSharkFinder(this.peakAndValleyArray);
      this.bearishShark = this.bearishSharkFinder(this.peakAndValleyArray);
      this.bullishBat = this.bullishBatFinder(this.peakAndValleyArray);
      this.bearishBat = this.bearishBatFinder(this.peakAndValleyArray);
      // plot rightmost pattern, and if there is none, plot whatever you find
      if (this.bullishCrab[2] === true) {
        this.datasets.push({label: 'Bullish Crab Predicted Trend', data: this.bullishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
        this.datasets.push({label: 'Bullish Crab', data: this.bullishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bullishCrab[3] * 100);
      } else if (this.bearishCrab[2] === true) {
        this.datasets.push({label: 'Bearish Crab Predicted Trend', data: this.bearishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bearish Crab', data: this.bearishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bearishCrab[3] * 100);
      } else if (this.bullishShark[2] === true) {
        this.datasets.push({label: 'Bullish Shark Predicted Trend', data: this.bullishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
        this.datasets.push({label: 'Bullish Shark', data: this.bullishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bullishShark[3] * 100);
      } else if (this.bearishShark[2] === true) {
        this.datasets.push({label: 'Bearish Shark Predicted Trend', data: this.bearishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bearish Shark', data: this.bearishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bearishShark[3] * 100);
      } else if (this.bullishBat[2] === true) {
        this.datasets.push({label: 'Bullish Bat Predicted Trend', data: this.bullishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bullish Bat', data: this.bullishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bullishBat[3] * 100);
      } else if (this.bearishBat[2] === true) {
        this.datasets.push({label: 'Bearish Bat Predicted Trend', data: this.bearishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bearish Bat', data: this.bearishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bearishBat[3] * 100);
      } else {
        if (this.bullishCrab[0].length != 0) {
          this.datasets.push({label: 'Bullish Crab Predicted Trend', data: this.bullishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
          this.datasets.push({label: 'Bullish Crab', data: this.bullishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bullishCrab[3] * 100);
        } else if (this.bearishCrab[0].length != 0) {
          this.datasets.push({label: 'Bearish Crab Predicted Trend', data: this.bearishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bearish Crab', data: this.bearishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bearishCrab[3] * 100);
        } else if (this.bullishShark[0].length != 0) {
          this.datasets.push({label: 'Bullish Shark Predicted Trend', data: this.bullishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
          this.datasets.push({label: 'Bullish Shark', data: this.bullishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bullishShark[3] * 100);
        } else if (this.bearishShark[0].length != 0) {
          this.datasets.push({label: 'Bearish Shark Predicted Trend', data: this.bearishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bearish Shark', data: this.bearishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bearishShark[3] * 100);
        } else if (this.bullishBat[0].length != 0) {
          this.datasets.push({label: 'Bullish Bat Predicted Trend', data: this.bullishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bullish Bat', data: this.bullishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bullishBat[3] * 100);
        } else if (this.bearishBat[0].length != 0) {
          this.datasets.push({label: 'Bearish Bat Predicted Trend', data: this.bearishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bearish Bat', data: this.bearishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bearishBat[3] * 100);
        }
      }
      this.datasets.push({label: 'Intelli Points', data: this.peakAndValleyArray, fill: false, borderColor: 'forestgreen', backgroundColor: '', pointBackgroundColor: 'green', borderDash: [0,0]});
      this.datasets.push({label: this.selectedStock.toLocaleUpperCase(), data: this.arrayTuple, fill: true, borderColor: 'rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', pointBackgroundColor: 'rgba(0,0,0,0.1)', borderDash: [0,0]})
      this.createChart();

      // AlphaVantage API key = 3Q62PTYW8KBTOCQ2
      // fibonacciFinder(peaksAndValleryArray); -bigger array (dotted continuation at end)
    });
  }

  public createChart(){
    this.chart = new Chart("MyChart", {
      type: 'line', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: this.indexArr,
        datasets: this.datasets,
      },
      options: {
        //devicePixelRatio: 1.3,
        responsive: true,
        plugins: {
          legend: {
            labels: {
                color: "black",
                font: {
                  size: 18,
                },
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: "dark grey", // not 'fontColor:' anymore
              font: {
                size: 19,
              },
              stepSize: 1,
            }
          },
          x: {
            ticks: {
              color: "dark grey",
              font: {
                size: 19,
              },
              stepSize: 1,
            }
          }
        }
      }
    });
  }


  public jsonToArray(response: StockData): [Array<number>, Array<string>] {
    // build the index
    let index = [];
    let valArray: Array<number> = [];
    let indexArray: Array<string> = [];
    for (let x in response['Time Series (5min)']) {
      index.push(x);
    }
    if (index.length === 0) {
      for (let x in response['Time Series (Daily)']) {
        index.push(x);
      }
      for (let i = index.length - 1; i >= 0; i--) {
        valArray.push(Number(response['Time Series (Daily)'][index[i]]['4. close']));
        indexArray.push(index[i]);
      }
    } else {
      for (let i = index.length - 1; i >= 0; i--) {
        valArray.push(Number(response['Time Series (5min)'][index[i]]['4. close']));
        indexArray.push(index[i]);
      }
    }
    
    return [valArray, indexArray];
  }

  setStock(newStock: Stock | null) {
    this.selectedStock = newStock!.value;
    this.chart.destroy();
    this.callAPI();
  }

  setTimeFrame(newTimeFrame: TimeFrame | null) {
    this.timeFrame = newTimeFrame!.value;
    this.chart.destroy();
    this.callAPI();
  }

  public peakAndValleyFinder(): Array<{x:string, y:number}> {
    let peakAndValleyArray: Array<{x:string, y:number}> = [];
    let all = [];
    for (let i = 0; i < this.array.length; i++) {
      all.push({x:this.indexArr[i], y:this.array[i], z:i});
    }
    let sortedArray = all.slice(0).sort((n1,n2) => n1.y - n2.y);
    //----------------------------MINS---------------------------------------------------------------------------------------------------------
    let mins = sortedArray.slice(0).slice(0,40).sort((n1,n2) => n1.z - n2.z);
    for (let i = 0; i < 20; i++) {
      //console.log('mins[i]y = '+mins[i].y+', '+'mins[i]z = '+mins[i].z);
    }
    let minsRefined = [];
    for (let i = 0; i < mins.length; i++) {
      if (i === 0) {
        if ((mins[0].y < mins[1].y) && (mins[0].y < mins[2].y) && (mins[0].y < mins[3].y)  && (mins[0].y < mins[4].y)) {
          minsRefined.push(mins[0]);
        }
      }
      if (i > 0) {
        if (i === mins.length-1) {
          if (mins[i].y < minsRefined[minsRefined.length-1].y || Math.abs(mins[i].z - minsRefined[minsRefined.length-1].z) > 4) {
            minsRefined.push(mins[i]);
          }
        } else if (i === mins.length-2) {
          if ((mins[i].y < mins[i-1].y && mins[i].y < mins[i-2].y) && (mins[i].y < mins[i+1].y)) {
            minsRefined.push(mins[i]);
          } else if (Math.abs(mins[i].z - mins[i-1].z) > 30 || Math.abs(mins[i].z - mins[i+1].z) > 30) {
            minsRefined.push(mins[i]);
          }
        } else if (i === 1) {
          if (mins[1].y < mins[0].y && mins[1].y < mins[2].y && mins[1].y < mins[3].y) {
            minsRefined.push(mins[1]);
          }
        } else if (i > 1 && i <= mins.length-3) { 
          if (minsRefined.length === 0){
            if (i === 2 && (mins[i].y < mins[i-1].y) && (mins[i].y < mins[i+1].y && mins[i].y < mins[i+2].y)) {
              minsRefined.push(mins[i]);
            } else if ((mins[i].y < mins[i-1].y && mins[i].y < mins[i-2].y) && (mins[i].y <= mins[i+1].y && mins[i].y < mins[i+2].y)) {
              minsRefined.push(mins[i]);
            } else {
              if (Math.abs(mins[i].z - mins[i-1].z) > 3 && mins[i].y < mins[i+1].y) { //if far from last point, only compare to forward
                minsRefined.push(mins[i]);
              } else if (Math.abs(mins[i].z - mins[i-1].z) > 25 || Math.abs(mins[i].z - mins[i+1].z) > 28) {
                minsRefined.push(mins[i]);
              }
            }
          } else {
            if (i === 2 && (mins[i].y < mins[i-1].y) && (mins[i].y < mins[i+1].y && mins[i].y < mins[i+2].y)) {
              minsRefined.push(mins[i]); 
            } else if ((mins[i].y < mins[i-1].y && mins[i].y < mins[i-2].y) && (mins[i].y <= mins[i+1].y)) {
              minsRefined.push(mins[i]);
            } else {
              if (Math.abs(mins[i].z - mins[i-1].z) > 3 && mins[i].y < mins[i+1].y && mins[i].y < mins[i+2].y) { //if far from last point, only compare to forward
                minsRefined.push(mins[i]);
              } else if (Math.abs(mins[i].z - mins[i-1].z) > 25 || Math.abs(mins[i].z - mins[i+1].z) > 28) {
                minsRefined.push(mins[i]);
              }
            }
          }
        } 
      }
    }

    // Find ignored valleys that are of middle value (Put inside of 304 as a nested if, and then the rest is under else)
    /*for (let i = 6; i < all.length - 7; i++) {
      if (all[i].y < all[i-1].y && all[i].y < all[i-2].y && all[i].y < all[i-3].y && all[i].y < all[i-4].y && all[i].y < all[i-5].y
        && all[i].y < all[i-6].y && all[i].y < all[i+1].y && all[i].y < all[i+2].y && all[i].y < all[i+3].y && all[i].y < all[i+4].y
        && all[i].y < all[i+5].y && all[i].y < all[i+6].y) {
          minsRefined.push(all[i]);
      }
    }*/

    let minsFinal = [];
    for (let i = 0; i < minsRefined.length; i++) {
      if (i === 0) {
        if ((minsRefined[0].y < minsRefined[1].y || (Math.abs(minsRefined[0].z - minsRefined[1].z) > 4))) {
          minsFinal.push(minsRefined[0]);
        }
      }
      if (i > 0) {
        if (i === minsRefined.length-1) {
          if (minsRefined[i].y < minsFinal[minsFinal.length-1].y || Math.abs(minsRefined[i].z - minsFinal[minsFinal.length-1].z) > 6) {
            minsFinal.push(minsRefined[i]);
          }
        } else if (i === 1) {
          if ((minsRefined[1].y < minsRefined[0].y || (Math.abs(minsRefined[1].z - minsRefined[0].z) > 6)) && (minsRefined[1].y < minsRefined[2].y || (Math.abs(minsRefined[1].z - minsRefined[2].z) > 6))) {
            minsFinal.push(minsRefined[1]);
          }
        } else if (i > 1 && i <= minsRefined.length-2) { 
          if (((minsRefined[i].y < minsRefined[i-1].y) || Math.abs(minsRefined[i].z - minsRefined[i-1].z) > 6) && (minsRefined[i].y <= minsRefined[i+1].y || (Math.abs(minsRefined[i].z - minsRefined[i+1].z) > 6))) {
            minsFinal.push(minsRefined[i]);
          }
        }
      }
    }
    
    //---------------------------MAXES-----------------------------------------------------------------------------------------------------
    let maxes = sortedArray.slice(0).reverse().slice(0,44);
    this.absoluteMax = maxes[0].y;
    maxes = maxes.sort((n1,n2) => n1.z - n2.z);
    //console.log('absolute max = '+ this.absoluteMax);
    for (let i = 0; i < 20; i++) {
      //console.log('maxes[i]y = '+maxes[i].y+', '+'maxes[i]z = '+maxes[i].z);
    }
    let maxesRefined = [];
    for (let i = 0; i < maxes.length; i++) {
      if (i === 0) {
        if ((maxes[0].y > maxes[1].y) && (maxes[0].y > maxes[2].y) && (maxes[0].y > maxes[3].y)  && (maxes[0].y > maxes[4].y)) {
          maxesRefined.push(maxes[0]);
        }
      }
      if (i > 0) {
        if (i === maxes.length-1) {
          if (maxes[i].y > maxesRefined[maxesRefined.length-1].y || Math.abs(maxes[i].z - maxesRefined[maxesRefined.length-1].z) > 4) {
            maxesRefined.push(maxes[i]);
          }
        } else if (i === maxes.length-2) {
          if ((maxes[i].y > maxes[i-1].y && maxes[i].y > maxes[i-2].y) && (maxes[i].y >= maxes[i+1].y)) {
            maxesRefined.push(maxes[i]);
          } else if (Math.abs(maxes[i].z - maxes[i-1].z) > 30 || Math.abs(maxes[i].z - maxes[i+1].z) > 30) {
            maxesRefined.push(maxes[i]);
          }
        } else if (i === 1) {
          if (maxes[1].y > maxes[0].y && maxes[1].y > maxes[2].y && maxes[1].y > maxes[3].y) {
            maxesRefined.push(maxes[1]);
          }
        } else if (i > 1 && i <= maxes.length-3) { 
          if (maxesRefined.length === 0){
            if (i === 2 && (maxes[i].y > maxes[i-1].y) && (maxes[i].y > maxes[i+1].y && maxes[i].y > maxes[i+2].y)) {
              maxesRefined.push(maxes[i]);
            } else if ((maxes[i].y > maxes[i-1].y && maxes[i].y > maxes[i-2].y) && (maxes[i].y >= maxes[i+1].y && maxes[i].y > maxes[i+2].y)) {
              maxesRefined.push(maxes[i]);
            } else {
              if (Math.abs(maxes[i].z - maxes[i-1].z) > 3 && maxes[i].y > maxes[i+1].y) { //if far from last point, only compare to forward
                maxesRefined.push(maxes[i]);
              } else if (Math.abs(maxes[i].z - maxes[i-1].z) > 25 || Math.abs(maxes[i].z - maxes[i+1].z) > 28) {
                maxesRefined.push(maxes[i]);
              }
            }
          } else {
            if (i === 2 && (maxes[i].y > maxes[i-1].y) && (maxes[i].y > maxes[i+1].y && maxes[i].y > maxes[i+2].y)) {
              maxesRefined.push(maxes[i]);
            } else if ((maxes[i].y > maxes[i-1].y && maxes[i].y > maxes[i-2].y) && (maxes[i].y >= maxes[i+1].y)) {
              maxesRefined.push(maxes[i]);
            } else {
              if (Math.abs(maxes[i].z - maxes[i-1].z) > 3 && maxes[i].y > maxes[i+1].y && maxes[i].y > maxes[i+2].y) { //if far from last point, only compare to forward
                maxesRefined.push(maxes[i]);
              } else if (Math.abs(maxes[i].z - maxes[i-1].z) > 25 || Math.abs(maxes[i].z - maxes[i+1].z) > 28) {
                maxesRefined.push(maxes[i]);
              }
            }
          }
        } 
      }
    }

    // Find ignored peaks that are of middle value
    /*for (let i = 6; i < all.length - 7; i++) {
      if (all[i].y > all[i-1].y && all[i].y > all[i-2].y && all[i].y > all[i-3].y && all[i].y > all[i-4].y && all[i].y > all[i-5].y
        && all[i].y > all[i-6].y && all[i].y > all[i+1].y && all[i].y > all[i+2].y && all[i].y > all[i+3].y && all[i].y > all[i+4].y
        && all[i].y > all[i+5].y && all[i].y > all[i+6].y) {
          maxesRefined.push(all[i]);
      }
    }
    maxesRefined.sort((n1,n2) => n1.z - n2.z);*/

    let maxesFinal = [];
    for (let i = 0; i < maxesRefined.length; i++) {
      if (i === 0) {
        if ((maxesRefined[0].y > maxesRefined[1].y || (Math.abs(maxesRefined[0].z - maxesRefined[1].z) > 4))) {
          maxesFinal.push(maxesRefined[0]);
        }
      }
      if (i > 0) {
        if (i === maxesRefined.length-1) {
          if (maxesRefined[i].y > maxesFinal[maxesFinal.length-1].y || Math.abs(maxesRefined[i].z - maxesFinal[maxesFinal.length-1].z) > 6) {
            maxesFinal.push(maxesRefined[i]);
          }
        } else if (i === 1) {
          if ((maxesRefined[1].y > maxesRefined[0].y || (Math.abs(maxesRefined[1].z - maxesRefined[0].z) > 6)) && (maxesRefined[1].y > maxesRefined[2].y || (Math.abs(maxesRefined[1].z - maxesRefined[2].z) > 6))) {
            maxesFinal.push(maxesRefined[1]);
          }
        } else if (i > 1 && i <= maxesRefined.length-2) { 
          if (((maxesRefined[i].y > maxesRefined[i-1].y) || Math.abs(maxesRefined[i].z - maxesRefined[i-1].z) > 6) && (maxesRefined[i].y > maxesRefined[i+1].y || (Math.abs(maxesRefined[i].z - maxesRefined[i+1].z) > 6))) {
            maxesFinal.push(maxesRefined[i]);
          }
        }
      }
    }

    let extremes = minsFinal.concat(maxesFinal);
    extremes = extremes.sort((n1,n2) => n1.z - n2.z);

    for (let i = 0; i < extremes.length; i++) {
      peakAndValleyArray.push({x:extremes[i].x, y:extremes[i].y});
    }
    

    return peakAndValleyArray;
  }

  public altPeakAndValleyFinder(resolution = 8): Array<{x:string, y:number}> {

    // segregate the list into 8ths. Find mins/maxes of each 8th
    let valleyArray: Array<{x:string, y:number, z:number}> = [];
    let peakArray: Array<{x:string, y:number, z:number}> = [];
    let peakAndValleyArray: Array<{x:string, y:number}> = [];
    let sliceSize = Math.ceil(this.array.length / resolution);
    //console.log('sliceSize = '+sliceSize)
    let pointer = 0;
    let count = 0;
    let sliceNumber = 0;

    for (let i = 0; i < resolution; i++){
      let floatingMin = 999999;
      let floatingMax = 0;
      let minIndx = '';
      let maxIndx = '';
      
      for (let j = pointer; j < pointer + sliceSize; j++) {
        if (pointer < this.array.length - 1) {
          if (this.array[j] < floatingMin) { floatingMin = this.array[j]; minIndx = this.indexArr[j]; sliceNumber = count;}
          if (this.array[j] > floatingMax) { floatingMax = this.array[j]; maxIndx = this.indexArr[j]; sliceNumber = count;}
          //console.log('pointer = '+ pointer);
          //TODO: fix first point the way you fixed the last point
        }
      }
      count += 1;
      valleyArray.push({x:minIndx, y:floatingMin, z:sliceNumber});
      peakArray.push({x:maxIndx, y:floatingMax, z:sliceNumber});
      pointer += sliceSize;
      //console.log('pointer  = ' + pointer);
      // !! Pointer is 3 short at end (96 and not 99) (now 104)
    }

    let median = 0;
    let sortedArray = this.array.slice(0).sort();
    if (sortedArray.length % 2 == 0){
      median = (sortedArray[Math.ceil((sortedArray.length - 1) / 2)] + sortedArray[Math.floor((sortedArray.length - 1) / 2)]) / 2;
    } else {
      median = sortedArray[sortedArray.length - 1 / 2];
    }

    let floatingDeviationValley = [];
    let floatingDeviationPeak = [];
    for (let i = 0; i < resolution; i++) {
      floatingDeviationValley.push({x:valleyArray[i].x, y:Math.abs(median - valleyArray[i].y), z:valleyArray[i].y, zz:valleyArray[i].z});
      floatingDeviationPeak.push({x:peakArray[i].x, y:Math.abs(median - peakArray[i].y), z:peakArray[i].y, zz:peakArray[i].z});   
    }

    // find starting point (largest deviation point in whole graph)
    let comparator = 0;
    let indx = '';
    let val = 0;
    let ind = 0;
    let flag = '';
    for (let i = 0; i < resolution; i++) {
      if (floatingDeviationValley[i].y > comparator) { comparator = floatingDeviationValley[i].y; indx = floatingDeviationValley[i].x; val = floatingDeviationValley[i].z, ind = floatingDeviationValley[i].zz, flag = 'valley'}
      if (floatingDeviationPeak[i].y > comparator) { comparator = floatingDeviationPeak[i].y; indx = floatingDeviationPeak[i].x; val = floatingDeviationPeak[i].z, ind = floatingDeviationPeak[i].zz, flag = 'peak'}
    }
    //console.log('itsAPArtyAy: '+ indx + ' ||| '+ val + '|||' + ind);

    // fill with peaks and valleys alternating based around max value and if it's a peak or valley and extrapolate out from the max val point (to the left and then to the right)
    let absoluteMaxPeak = 0;
    for (let i = 0; i < peakArray.length; i++) {
      if (peakArray[i].y > absoluteMaxPeak) {
        absoluteMaxPeak = peakArray[i].y;
      }
    }
    //console.log('absoluteMaxPeak = '+absoluteMaxPeak);
    //console.log('ind = '+ ind);
    if (ind > 1){
      let count = 0;
      let leftSide = [];
      let rightSide = [];
      if (flag === 'valley'){
        for (let i = ind - 1; i >= 0; i--) {     
          if (i === 0) {
            if (peakArray[0].y > peakArray[1].y) {
              leftSide.push({x:peakArray[i].x ,y:peakArray[i].y });
            }
            // !! make less hardcoded. I LEFT OFF HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!**************************************************************************
          } else {
            if (count % 2 === 0){
              leftSide.push({x:peakArray[i].x ,y:peakArray[i].y });
            } else {
              leftSide.push({x:valleyArray[i].x ,y:valleyArray[i].y });
            }
          }
          count++;
        }
        leftSide.reverse();
        leftSide.push({x:indx, y:val});
        count = 0;
        for (let i = ind + 1; i < resolution; i++) {  
          if (count % 2 === 0){
            rightSide.push({x:peakArray[i].x ,y:peakArray[i].y });
          } else if (count !== resolution - 1){
            rightSide.push({x:valleyArray[i].x ,y:valleyArray[i].y });  
          } else {
            if (peakArray[i].y === absoluteMaxPeak) {
              rightSide.push({x:peakArray[i].x ,y:peakArray[i].y });
            }
          }
          count++;
        }
        peakAndValleyArray = leftSide.concat(rightSide);
      } else {
        for (let i = ind - 1; i >= 0; i--) {     
          if (i === 0) {
            if (valleyArray[0].y > valleyArray[1].y) {
              leftSide.push({x:valleyArray[i].x ,y:valleyArray[i].y });
            }
            // !! make less hardcoded. I LEFT OFF HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!**************************************************************************
          } else {
            if (count % 2 === 0){
              leftSide.push({x:valleyArray[i].x ,y:valleyArray[i].y });
            } else {
              leftSide.push({x:peakArray[i].x ,y:peakArray[i].y });
            }
          }
          count++;
        }
        leftSide.reverse();
        leftSide.push({x:indx, y:val});
        count = 0;
        for (let i = ind + 1; i < resolution; i++) {  
          if (count % 2 === 0){
            rightSide.push({x:valleyArray[i].x ,y:valleyArray[i].y });
          } else if (count !== resolution - 1){
            rightSide.push({x:peakArray[i].x ,y:peakArray[i].y });  
          } else {
            if (valleyArray[i].y === absoluteMaxPeak) {
              rightSide.push({x:valleyArray[i].x ,y:valleyArray[i].y });
            }
          }
          count++;
        }
        peakAndValleyArray = leftSide.concat(rightSide);
      }
    } else {
      // Still broken
      let count = 0;
      if (flag === 'valley'){ 
        count = 0;
        peakAndValleyArray.push({x:indx, y:val});
        for (let i = 1; i < resolution; i++) {  
          if (count % 2 === 0){
            peakAndValleyArray.push({x:peakArray[i].x ,y:peakArray[i].y });
          } else if (count !== resolution - 1){
            peakAndValleyArray.push({x:valleyArray[i].x ,y:valleyArray[i].y });  
          } else {
            if (peakArray[i].y === absoluteMaxPeak) {
              peakAndValleyArray.push({x:peakArray[i].x ,y:peakArray[i].y });
            }
          }
          count++;
        }
      } else {
        count = 0;
        peakAndValleyArray.push({x:indx, y:val});
        for (let i = 1; i < resolution; i++) {  
          if (count % 2 === 0){
            peakAndValleyArray.push({x:valleyArray[i].x ,y:valleyArray[i].y });
          } else if (count !== resolution - 1){
            peakAndValleyArray.push({x:peakArray[i].x ,y:peakArray[i].y });  
          } else {
            if (valleyArray[i].y === absoluteMaxPeak) {
              peakAndValleyArray.push({x:valleyArray[i].x ,y:valleyArray[i].y });
            }
          }
          count++;
        }
      }
    }
    //peakAndValleyArray.push({x:'2023-10-31 11:55:00', y:405});
    return peakAndValleyArray;
  }

  public generatePredictedEndpointXCoord(): string {
    let blah = new Date(this.indexArr[this.indexArr.length-1]);
    blah.setMonth(blah.getMonth()+2);
    let blahh = this.datepipe.transform(blah, 'YYYY-MM-dd');
    return blahh!.toString();
  }


  public fibonacciFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean] {
    let fibPoints1 = []; //when point is successfully found (near .618 or .382) or initial 100% points
    let fibPoints2 = [];
    let oneHundredPercent = 0;
    let xPercent = 0;
    let fib1 = .618;
    let fib2 = .382;
    let isLatestTrend = false;
    for (let i = 0; i < peakAndValleyArray.length-2; i++) {
      oneHundredPercent = Math.abs(peakAndValleyArray[i].y - peakAndValleyArray[i+1].y);
      xPercent = Math.abs(peakAndValleyArray[i+1].y - peakAndValleyArray[i+2].y);
      let percent = xPercent / oneHundredPercent;
      if (Math.abs(percent - fib1) < .05) {
        //console.log('cool point found1' + ': ' + peakAndValleyArray[i].x +', '+ peakAndValleyArray[i+1].x +', '+peakAndValleyArray[i+2].x);
        fibPoints1.push(peakAndValleyArray[i]);
        fibPoints1.push(peakAndValleyArray[i+1]);
        fibPoints1.push(peakAndValleyArray[i+2]);
        
        if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
          isLatestTrend = true;
        }
      } else if (Math.abs(percent - fib2) < .05) {
        //console.log('cool point found2' + ': ' + peakAndValleyArray[i].x +', '+ peakAndValleyArray[i+1].x +', '+peakAndValleyArray[i+2].x);
        fibPoints2.push(peakAndValleyArray[i]);
        fibPoints2.push(peakAndValleyArray[i+1]);
        fibPoints2.push(peakAndValleyArray[i+2]);
        
        if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
          isLatestTrend = true;
        }
      }
    }
    return [fibPoints1, fibPoints2, isLatestTrend];
  }

  public bullishCrabFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bullishCrabPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y > peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i].y && 
        peakAndValleyArray[i+2].y < peakAndValleyArray[i+3].y && peakAndValleyArray[i+3].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y < peakAndValleyArray[i].y) {
          bullishCrabPoints.push(peakAndValleyArray[i]);
          bullishCrabPoints.push(peakAndValleyArray[i+1]);
          bullishCrabPoints.push(peakAndValleyArray[i+2]);
          bullishCrabPoints.push(peakAndValleyArray[i+3]);
          bullishCrabPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y + ((this.absoluteMax - projectedPoints[0].y) / 2));
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }
        
          accuracyScore = this.getAccuracyScore(bullishCrabPoints[0].y, bullishCrabPoints[1].y, bullishCrabPoints[2].y, bullishCrabPoints[3].y, bullishCrabPoints[4].y);
      }
    }

    return [bullishCrabPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bearishCrabFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bearishCrabPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y < peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y < peakAndValleyArray[i].y && 
        peakAndValleyArray[i+2].y > peakAndValleyArray[i+3].y && peakAndValleyArray[i+3].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y > peakAndValleyArray[i].y) {
          bearishCrabPoints.push(peakAndValleyArray[i]);
          bearishCrabPoints.push(peakAndValleyArray[i+1]);
          bearishCrabPoints.push(peakAndValleyArray[i+2]);
          bearishCrabPoints.push(peakAndValleyArray[i+3]);
          bearishCrabPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * .96);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }
        
          accuracyScore = this.getAccuracyScore(bearishCrabPoints[0].y, bearishCrabPoints[1].y, bearishCrabPoints[2].y, bearishCrabPoints[3].y, bearishCrabPoints[4].y);
      }
    }
    return [bearishCrabPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bullishSharkFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bullishSharkPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y > peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i].y && 
        peakAndValleyArray[i+3].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y < peakAndValleyArray[i+2].y) {
          bullishSharkPoints.push(peakAndValleyArray[i]);
          bullishSharkPoints.push(peakAndValleyArray[i+1]);
          bullishSharkPoints.push(peakAndValleyArray[i+2]);
          bullishSharkPoints.push(peakAndValleyArray[i+3]);
          bullishSharkPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y + ((this.absoluteMax - projectedPoints[0].y) / 2));
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }
        
          accuracyScore = this.getAccuracyScore(bullishSharkPoints[0].y, bullishSharkPoints[1].y, bullishSharkPoints[2].y, bullishSharkPoints[3].y, bullishSharkPoints[4].y);
      }
    }
    return [bullishSharkPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bearishSharkFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bearishSharkPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y < peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y < peakAndValleyArray[i].y && 
        peakAndValleyArray[i+3].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y > peakAndValleyArray[i+2].y) {
          bearishSharkPoints.push(peakAndValleyArray[i]);
          bearishSharkPoints.push(peakAndValleyArray[i+1]);
          bearishSharkPoints.push(peakAndValleyArray[i+2]);
          bearishSharkPoints.push(peakAndValleyArray[i+3]);
          bearishSharkPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          
          secondPointXCoord = this.generatePredictedEndpointXCoord();//this.indexArr[this.indexArr.length-1];
          secondPointYCoord = (projectedPoints[0].y * 0.96);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});

          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }

          accuracyScore = this.getAccuracyScore(bearishSharkPoints[0].y, bearishSharkPoints[1].y, bearishSharkPoints[2].y, bearishSharkPoints[3].y, bearishSharkPoints[4].y);
      }
    }
    return [bearishSharkPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bullishBatFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bullishBatPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y > peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i].y &&
        peakAndValleyArray[i+2].y < peakAndValleyArray[i+3].y && peakAndValleyArray[i+3].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+3].y > peakAndValleyArray[i+4].y && peakAndValleyArray[i+4].y > peakAndValleyArray[i].y) {
          bullishBatPoints.push(peakAndValleyArray[i]);
          bullishBatPoints.push(peakAndValleyArray[i+1]);
          bullishBatPoints.push(peakAndValleyArray[i+2]);
          bullishBatPoints.push(peakAndValleyArray[i+3]);
          bullishBatPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y - ((this.absoluteMax - projectedPoints[0].y) / 2));
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});

          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }

          accuracyScore = this.getAccuracyScore(bullishBatPoints[0].y, bullishBatPoints[1].y, bullishBatPoints[2].y, bullishBatPoints[3].y, bullishBatPoints[4].y);
      }
    }
    return [bullishBatPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bearishBatFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bearishBatPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y < peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y < peakAndValleyArray[i].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i+3].y &&
        peakAndValleyArray[i+3].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+3].y < peakAndValleyArray[i+4].y && peakAndValleyArray[i+4].y < peakAndValleyArray[i].y) {
          bearishBatPoints.push(peakAndValleyArray[i]);
          bearishBatPoints.push(peakAndValleyArray[i+1]);
          bearishBatPoints.push(peakAndValleyArray[i+2]);
          bearishBatPoints.push(peakAndValleyArray[i+3]);
          bearishBatPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * .96);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }

          accuracyScore = this.getAccuracyScore(bearishBatPoints[0].y, bearishBatPoints[1].y, bearishBatPoints[2].y, bearishBatPoints[3].y, bearishBatPoints[4].y);
      }
    }
    return [bearishBatPoints, projectedPoints, isLatestTrend, accuracyScore];
  } 

  getAccuracyScore(a: number, b: number, c: number, d: number, e: number): number {
    //now capture how similar to desired ratio I am. If desired ratio is a range and you're in it, return 100% for that piece.  
    let line0 = Math.abs(a - b);
    let line1 = Math.abs(b - c);
    let line2 = Math.abs(c - d);
    let line3 = Math.abs(d - e);
    let ratio1 = line1 / line0;
    let ratio1Rating = 0;
    let ratio2 = line2 / line1;
    let ratio2Rating = 0;
    let ratio3 = line3 / line2;
    let ratio3Rating = 0;
    if (ratio1 > .382 && ratio1 < .618) {
      ratio1Rating = 1;
    } else if (ratio1 < .382) {
      ratio1Rating = ratio1 / .382;
    } else if (ratio1 > .618) {
      ratio1Rating = .618 / ratio1;
    }
    if (ratio2 > .382 && ratio2 < .886) {
      ratio2Rating = 1;
    } else if (ratio2 < .382) {
      ratio2Rating = ratio2 / .382;
    } else if (ratio2 > .886) {
      ratio2Rating = .886 / ratio2;
    }
    if (ratio3 > 1.618) {
      ratio3Rating = 1.618 / ratio3;
    } else if (ratio3 < 1.618) {
      ratio3Rating = ratio3 / 1.618;
    } else (ratio3Rating = 1)
    let finalScore = (ratio1Rating + ratio2Rating + ratio3Rating) / 3;
    return finalScore;
  }
}
// TODO: Google how much stock is supposed to rise/fall with these algs